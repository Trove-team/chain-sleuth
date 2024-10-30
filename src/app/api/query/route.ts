import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = new PipelineService();

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    const body = await request.json();
    
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query format. Expected {"query": "your query string"}' },
        { status: 400 }
      );
    }

    const query = body.query;
    const token = await pipelineService.getToken();

    logger.info({
      requestId,
      msg: 'Making query request',
      query
    });

    const response = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: query 
      })
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