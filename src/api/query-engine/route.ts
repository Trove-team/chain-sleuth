import { Elysia, t } from "elysia";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine');
const pipelineService = new PipelineService();

// Get base URL from environment or use default
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chain-sleuth.vercel.app';

const queryEngineRoutes = new Elysia({ prefix: "/query-engine" })
  .post("/query", async ({ body }) => {
    const requestId = uuidv4();
    
    try {
      const { query, accountId } = body;
      
      logger.info('Received request:', {
        requestId,
        query,
        accountId,
        url: `${BASE_URL}/api/query`
      });
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({ query, accountId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const responseText = await response.text();
      
      logger.info('Received response:', {
        requestId,
        status: response.status,
        responseText
      });

      return new Response(responseText, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      logger.error('Error in query-engine route:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        return new Response('Query timed out. Please try a simpler query.', { 
          status: 408 
        });
      }

      return new Response('Failed to process query: ' + 
        (error instanceof Error ? error.message : 'Unknown error'), 
        { status: 500 }
      );
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
    }),
    detail: {
      summary: 'Execute a natural language query about NEAR accounts',
      description: 'Analyzes NEAR blockchain accounts using natural language queries. Use "analyze" followed by your request.',
      tags: ['Query Engine']
    }
  });

export default queryEngineRoutes;
