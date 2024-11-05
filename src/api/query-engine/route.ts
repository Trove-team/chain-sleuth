import { Elysia, t } from "elysia";
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine');
const pipelineService = PipelineService.getInstance();

const queryEngineRoutes = new Elysia({ prefix: "/query-engine" })
  .post("/query", async ({ body }) => {
    const requestId = uuidv4();
    
    try {
      const { query, accountId: inputAccountId } = body as { query: string; accountId?: string };
      const accountId = inputAccountId || 'trovelabs.near';
      const token = await pipelineService.getToken();

      // Match Next.js timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({ query, accountId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      const formattedResponse = formatResponse(responseText);
      return new Response(JSON.stringify(formattedResponse), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error('Error in query-engine route:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof Error && error.name === 'AbortError') {
        return new Response('Query timed out. Please try a simpler query.', { 
          status: 408 
        });
      }

      return new Response('Failed to process query', { status: 500 });
    }
  });

const formatResponse = (response: string) => {
    try {
        // First try parsing as JSON
        const parsed = JSON.parse(response);
        return parsed;
    } catch (e) {
        // If parsing fails, check if it's the Query time format
        if (response.includes('Query time')) {
            // Extract the actual JSON part
            const jsonStart = response.indexOf('{');
            const jsonEnd = response.lastIndexOf('}') + 1;
            if (jsonStart >= 0 && jsonEnd > 0) {
                const jsonPart = response.slice(jsonStart, jsonEnd);
                return JSON.parse(jsonPart);
            }
        }
        // If all else fails, return the raw response
        console.warn('Response parsing failed:', e);
        return { raw: response };
    }
};

export default queryEngineRoutes;
