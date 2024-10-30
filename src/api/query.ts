///front end query engine
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = new PipelineService();

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    const { query, accountId } = await request.json();
    const token = await pipelineService.getToken();

    logger.info('Query request received', {
      requestId,
      query,
      service: 'query-engine-nextjs'
    });

    const response = await fetch(`${process.env.NEO4J_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({ query, accountId })
    });

    if (!response.ok) {
      throw new Error(`Neo4j API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    logger.error('Error processing query', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'query-engine-nextjs'
    });

    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}