import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = new PipelineService();

export const runtime = 'edge'; // Optional: Use edge runtime for better performance
export const maxDuration = 25; // 25 seconds max

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    const body = await request.json();
    
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query format. Please provide a query string.' },
        { status: 400 }
      );
    }

    const query = body.query;
    const accountId = body.accountId || 'trovelabs.near';
    const token = await pipelineService.getToken();

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({ 
        query,
        accountId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    return new Response(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (error) {
    logger.error({
      requestId,
      msg: 'Error processing query',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    if (error instanceof Error && error.name === 'AbortError') {
      return new Response('Query timed out. Please try a simpler query.', { status: 408 });
    }

    return new Response('Failed to process query', { status: 500 });
  }
}