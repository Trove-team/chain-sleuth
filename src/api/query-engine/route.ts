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
      
      // Add shorter timeout for Vercel functions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 seconds to be safe

      const response = await fetch(`${BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Timeout-Limit': '9000' // Pass timeout info to Next.js
        },
        body: JSON.stringify({ query, accountId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle non-200 responses
        const errorText = await response.text();
        logger.error('Non-200 response:', {
          requestId,
          status: response.status,
          error: errorText
        });
        return new Response(errorText, {
          status: response.status,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      const responseText = await response.text();
      return new Response(responseText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Query timeout:', { requestId });
        return new Response(
          'Query processing took too long. Try a simpler query or a different account.', 
          { status: 408 }
        );
      }

      logger.error('Query error:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return new Response(
        'Failed to process query. Please try again later.',
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
