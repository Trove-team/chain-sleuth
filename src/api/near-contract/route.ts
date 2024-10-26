import { Elysia, Context, t } from "elysia";
import { connect, keyStores, providers } from "near-api-js";
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
interface InvestigationStatus {
  stage: 'queued' | 'processing' | 'complete' | 'error';
  message: string;
  progress: number;
  currentStep: string;
}

interface TaskStatus {
  status: string;
  progress: string;
  currentStep: string;
  result?: string;
  error?: string;
}

interface AnalysisResult {
  robust_summary: string;
  short_summary: string;
  [key: string]: any;
}

// Configuration
const CONTRACT_ID = process.env.NEAR_CONTRACT_ID || "";
const NETWORK_ID = process.env.NEAR_NETWORK || "testnet";
const NEO4J_API_KEY = process.env.NEO4J_API_KEY;
const NEO4J_API_URL = process.env.NEO4J_API_URL;

// Redis setup
const redis = new Redis(process.env.REDIS_URL || '');

const config = {
  networkId: NETWORK_ID,
  keyStore: new keyStores.InMemoryKeyStore(),
  nodeUrl: `https://rpc.${NETWORK_ID}.near.org`,
  walletUrl: `https://wallet.${NETWORK_ID}.near.org`,
  helperUrl: `https://helper.${NETWORK_ID}.near.org`,
  explorerUrl: `https://explorer.${NETWORK_ID}.near.org`,
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // Maximum requests per window
const RATE_LIMIT_KEY_PREFIX = 'ratelimit:';

// Rate limiting middleware
const rateLimit = async (context: Context) => {
  const clientIp = context.request.headers.get('x-forwarded-for') || 'unknown';
  const key = `${RATE_LIMIT_KEY_PREFIX}${clientIp}`;
  
  try {
    const current = await redis.incr(key);
    
    // Set expiry on first request
    if (current === 1) {
      await redis.pexpire(key, RATE_LIMIT_WINDOW);
    }
    
    const ttl = await redis.pttl(key);
    
    context.set.headers = {
      'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
      'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX - current).toString(),
      'X-RateLimit-Reset': (Date.now() + ttl).toString()
    };

    if (current > RATE_LIMIT_MAX) {
      context.set.status = 429;
      return formatResponse(false, null, 'Too Many Requests');
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Continue on rate limiting error
  }
};

// Error handling helper
const handleError = (error: any, context: string) => {
  const errorMessage = error?.message || 'Unknown error occurred';
  const errorDetails = {
    timestamp: new Date().toISOString(),
    context,
    message: errorMessage,
    stack: error?.stack,
  };
  
  console.error(JSON.stringify(errorDetails, null, 2));
  return {
    success: false,
    error: errorMessage,
    context
  };
};

// Response formatter
const formatResponse = (success: boolean, data?: any, error?: string) => ({
  success,
  ...(data && { data }),
  ...(error && { error }),
  timestamp: new Date().toISOString()
});

// Transaction verification middleware
const verifyContractCall = async (context: Context) => {
  const txHash = context.request.headers.get('x-transaction-hash');
  
  if (!txHash) {
    context.set.status = 401;
    return { success: false, error: 'Missing transaction hash' };
  }

  try {
    const processed = await redis.get(`tx:${txHash}`);
    if (processed) {
      context.set.status = 400;
      return { success: false, error: 'Transaction already processed' };
    }

    const near = await connect(config);
    const provider = near.connection.provider as providers.JsonRpcProvider;
    const tx = await provider.txStatus(txHash, CONTRACT_ID);
    
    if (tx.transaction.receiver_id !== CONTRACT_ID) {
      context.set.status = 401;
      return { success: false, error: 'Invalid contract' };
    }

    await redis.set(`tx:${txHash}`, '1', 'EX', 3600);
    return { success: true };

  } catch (error) {
    console.error('Contract verification error:', error);
    context.set.status = 401;
    return { success: false, error: 'Invalid transaction' };
  }
};

// Neo4j service interaction
async function callNeo4jAnalysis(accountId: string) {
  try {
    const response = await fetch(`${NEO4J_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NEO4J_API_KEY}`
      },
      body: JSON.stringify({ accountId })
    });

    if (!response.ok) {
      throw new Error(`Neo4j service error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Neo4j analysis error:', error);
    throw error;
  }
}

// Update contract with analysis progress
async function updateContractProgress(contractId: string, taskId: string, status: TaskStatus) {
  try {
    const near = await connect(config);
    const account = await near.account(CONTRACT_ID);
    
    await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'update_investigation_progress',
      args: {
        request_id: contractId,
        task_id: taskId,
        status: status.status,
        progress: parseInt(status.progress, 10),
        current_step: status.currentStep
      },
      gas: BigInt('300000000000000')
    });
  } catch (error) {
    console.error('Error updating contract progress:', error);
  }
}

const nearContractRoutes = new Elysia({ prefix: "/near-contract" })
  // Add global error handler
  .onError(({ code, error, set }) => {
    console.error(`Global error handler - Code: ${code}`, error);
    set.status = code === 'NOT_FOUND' ? 404 : 500;
    return formatResponse(false, null, error.message);
  })

  // Add request logging
  .derive(({ request }) => {
    const requestId = uuidv4();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      method: request.method,
      path: request.url,
      headers: Object.fromEntries(request.headers.entries())
    }, null, 2));
    return { requestId };
  })

  // Analysis endpoint
  .post("/analyze", async ({ body, requestId }) => {
    await rateLimit({ request: { headers: new Headers() }, set: { status: 0, headers: {} } } as Context);
    
    console.log(`[${requestId}] Starting analysis for account: ${body.accountId}`);
    
    try {
      const taskId = uuidv4();

      await redis.hset(`task:${taskId}`, {
        status: 'queued',
        progress: '0',
        currentStep: 'Analysis queued',
        accountId: body.accountId,
        contractRequestId: body.contractRequestId,
        requestId,
        startTime: Date.now()
      });

      console.log(`[${requestId}] Task created: ${taskId}`);

      callNeo4jAnalysis(body.accountId)
        .then(async (result) => {
          console.log(`[${requestId}] Analysis completed for task: ${taskId}`);
          
          const analysisStatus = {
            status: 'complete',
            progress: '100',
            currentStep: 'Analysis complete',
            result: JSON.stringify(result),
            completionTime: Date.now()
          };

          await redis.hset(`task:${taskId}`, analysisStatus);
          await updateContractProgress(body.contractRequestId, taskId, analysisStatus);
        })
        .catch(async (error) => {
          console.error(`[${requestId}] Analysis failed for task: ${taskId}`, error);
          
          const errorStatus = {
            status: 'error',
            progress: '0',
            currentStep: 'Analysis failed',
            error: error.message,
            errorTime: Date.now()
          };

          await redis.hset(`task:${taskId}`, errorStatus);
          await updateContractProgress(body.contractRequestId, taskId, errorStatus);
        });

      return formatResponse(true, {
        taskId,
        statusLink: `/api/near-contract/status/${taskId}`,
        message: 'Analysis queued successfully'
      });

    } catch (error) {
      return handleError(error, `Analysis request for account: ${body.accountId}`);
    }
  }, {
    body: t.Object({
      accountId: t.String(),
      contractRequestId: t.String()
    })
  })

  // Status check endpoint
  .get("/status/:taskId", async ({ params, requestId }) => {
    await rateLimit({ request: { headers: new Headers() }, set: { status: 0, headers: {} } } as Context);
    
    console.log(`[${requestId}] Checking status for task: ${params.taskId}`);
    
    try {
      const task = await redis.hgetall(`task:${params.taskId}`);

      if (!task || Object.keys(task).length === 0) {
        console.log(`[${requestId}] Task not found: ${params.taskId}`);
        return formatResponse(false, null, 'Task not found');
      }

      let duration: number | undefined;
if (task.startTime) {
  const endTime = Number(task.completionTime || task.errorTime || Date.now());
  const startTime = Number(task.startTime);
  if (!isNaN(endTime) && !isNaN(startTime)) {
    duration = endTime - startTime;
  }
}

      return formatResponse(true, {
        status: task.status,
        progress: parseInt(task.progress, 10),
        currentStep: task.currentStep,
        duration,
        ...(task.result && { result: JSON.parse(task.result) }),
        ...(task.error && { error: task.error })
      });

    } catch (error) {
      return handleError(error, `Status check for task: ${params.taskId}`);
    }
  })

  // Health check endpoint
  .get("/health", async ({ requestId }) => {
    await rateLimit({ request: { headers: new Headers() }, set: { status: 0, headers: {} } } as Context);
    
    console.log(`[${requestId}] Health check requested`);
    
    try {
      return formatResponse(true, {
        status: 'healthy',
        redis: redis.status === 'ready' ? 'connected' : 'disconnected',
        timestamp: Date.now()
      });
    } catch (error) {
      return handleError(error, 'Health check');
    }
  });

// Add cleanup for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Cleaning up...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Cleaning up...');
  await redis.quit();
  process.exit(0);
});

export default nearContractRoutes;
