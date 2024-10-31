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
      
      // Forward to Next.js API route
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({ query, accountId })
      });

      const data = await response.json();

      // Format response for AI plugin
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            synthesized_response: data.results?.[0] || data,
            query,
            accountId
          }
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      logger.error('Error in query-engine route:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Failed to process query',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
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
