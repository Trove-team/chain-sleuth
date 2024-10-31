import { Elysia, t } from "elysia";
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine');
const pipelineService = new PipelineService();

// Define request body type
interface QueryRequest {
  query: string;
  accountId?: string;
}

const queryEngineRoutes = new Elysia({ prefix: "/query-engine" })
  .post("/query", async ({ body }) => {
    const requestId = uuidv4();
    
    try {
      // Type assertion for body
      const { query, accountId } = body as QueryRequest;
      const token = await pipelineService.getToken();

      logger.info('Making request to Neo4j:', {
        requestId,
        query,
        accountId
      });

      const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({ query, accountId }),
        signal: AbortSignal.timeout(9000)
      });

      const responseText = await response.text();
      
      logger.info('Received Neo4j response:', {
        requestId,
        status: response.status
      });

      return new Response(responseText, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      logger.error('Query error:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof Error && error.name === 'TimeoutError') {
        return new Response('Query timed out. Please try a simpler query.', { 
          status: 408 
        });
      }

      return new Response('Failed to process query', { status: 500 });
    }
  }, {
    body: t.Object({
      query: t.String({
        description: 'Natural language query about the account',
        examples: ['analyze transaction patterns for account.near']
      }),
      accountId: t.Optional(t.String({
        description: 'NEAR account ID to analyze',
        pattern: '^[a-z0-9_-]+\\.near$'
      }))
    })
  });

export default queryEngineRoutes;
