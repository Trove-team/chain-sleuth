import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = new PipelineService();

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    const { query } = await request.json();
    const token = await pipelineService.getToken();

    logger.info({
      requestId,
      msg: 'Making query request',
      query
    });

    const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({
        requestId,
        msg: 'Query error response',
        status: response.status,
        error: errorText
      });
      throw new Error(`Query failed: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    logger.error({
      requestId,
      msg: 'Error processing query',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}