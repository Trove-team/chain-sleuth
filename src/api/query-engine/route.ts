import { Elysia, t } from "elysia";
import axios from "axios";
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

      logger.info('Query request received', {
        requestId,
        query,
        accountId,
        service: 'query-engine'
      });

      if (!query || typeof query !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid query format. Query must be a non-empty string.' }), 
          { status: 400 }
        );
      }

      const response = await axios.post(
        `${process.env.NEO4J_API_URL}/query`,
        { query, accountId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          }
        }
      );

      logger.info('Query executed successfully', {
        requestId,
        service: 'query-engine'
      });

      return response.data;

    } catch (error) {
      logger.error('Error processing query', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        service: 'query-engine'
      });

      if (axios.isAxiosError(error) && error.response?.data) {
        return new Response(
          JSON.stringify(error.response.data),
          { status: error.response.status || 500 }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to process query' }),
        { status: 500 }
      );
    }
  }, {
    body: t.Object({
      query: t.String(),
      accountId: t.Optional(t.String())
    }),
    detail: {
      summary: 'Execute a natural language query',
      tags: ['Query Engine']
    }
  });

export default queryEngineRoutes;
