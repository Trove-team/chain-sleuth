// src/api/near-contract/route.ts

import { Elysia, t } from "elysia";
import { Redis } from 'ioredis';
import { InvestigationWorkflow } from '../../services/investigationWorkflow';
import { createLogger } from '../../utils/logger';

// Configuration
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

// Setup
const redis = new Redis(process.env.REDIS_URL || '');
const logger = createLogger('near-contract-routes');
const workflow = new InvestigationWorkflow();

// Rate limiting middleware
const rateLimit = async (context: any) => {
  const clientIp = context.request.headers.get('x-forwarded-for') || 'unknown';
  const key = `ratelimit:${clientIp}`;
  
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, RATE_LIMIT.WINDOW_MS);
    }

    if (current > RATE_LIMIT.MAX_REQUESTS) {
      context.set.status = 429;
      return {
        success: false,
        error: 'Too Many Requests',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    logger.error('Rate limiting error:', error);
  }
};

const nearContractRoutes = new Elysia({ prefix: "/near-contract" })
  // Error handler
  .onError(({ code, error }) => {
    logger.error(`Error [${code}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  })

  // Main investigation endpoint (for AI plugin)
  .post("/investigate", 
    async ({ body }) => {
      logger.info('Starting investigation:', body);
      
      try {
        const result = await workflow.executeFullInvestigation(
          body.target_account,
          body.deposit
        );

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        logger.error('Investigation failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        };
      }
    },
    {
      beforeHandle: [rateLimit],
      body: t.Object({
        target_account: t.String({
          description: "NEAR account to investigate",
          examples: ["example.near"]
        }),
        deposit: t.String({
          description: "Deposit amount in NEAR",
          examples: ["1"]
        })
      })
    }
  )

  // Status check endpoint (for frontend)
  .get("/status/:requestId", 
    async ({ params }) => {
      logger.info('Checking status for:', params.requestId);
      
      try {
        const status = await workflow.getInvestigationStatus(params.requestId);
        return {
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        logger.error('Status check failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        };
      }
    },
    {
      beforeHandle: [rateLimit]
    }
  )

  // Health check endpoint (required for AI plugin)
  .get("/health", 
    async () => {
      try {
        const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
        logger.info('Health check:', { redis: redisStatus });
        
        return {
          success: true,
          data: {
            status: 'healthy',
            redis: redisStatus,
            timestamp: Date.now()
          }
        };
      } catch (error) {
        logger.error('Health check failed:', error);
        return {
          success: false,
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        };
      }
    }
  );

// Cleanup
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await redis.quit();
  process.exit(0);
});

export default nearContractRoutes;
