import { Elysia, t } from "elysia";
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine');
const pipelineService = new PipelineService();

const queryEngineRoutes = new Elysia({ prefix: "/query-engine" })
  .post("/query", async ({ body }) => {
    const requestId = uuidv4();
    
    try {
      const { query, accountId } = body;
      const token = await pipelineService.getToken();

      logger.info('Making request to Neo4j:', {
        requestId,
        query,
        accountId
      });

      // Direct request to Neo4j instead of proxying through Next.js
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
  });

export default queryEngineRoutes;
