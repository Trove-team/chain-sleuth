import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = new PipelineService();

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    logger.info('Starting query request', { requestId });
    
    const { query, accountId } = await request.json();
    logger.info('Request parsed', { requestId, query, accountId });
    
    const token = await pipelineService.getToken();
    logger.info('Token acquired', { requestId });

    if (!process.env.NEO4J_API_URL) {
      throw new Error('NEO4J_API_URL environment variable is not set');
    }

    const response = await fetch(`${process.env.NEO4J_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({ query, accountId })
    });

    logger.info('Neo4j response received', { 
      requestId, 
      status: response.status 
    });

    if (!response.ok) {
      throw new Error(`Neo4j API responded with ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    logger.error('Error processing query', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      service: 'query-engine-nextjs'
    });

    return NextResponse.json(
      { 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}