import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = PipelineService.getInstance();

export const maxDuration = 25;

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    await pipelineService.initialize();
    const body = await request.json();
    
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query format. Please provide a query string.' },
        { status: 400 }
      );
    }

    const result = await pipelineService.executeQuery(body.query, body.accountId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}