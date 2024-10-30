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
    
    if (!body.query || typeof body.query !== 'string' || !body.accountId) {
      return NextResponse.json(
        { error: 'Invalid query format. Expected {"query": "your query string", "accountId": "account.near"}' },
        { status: 400 }
      );
    }

    const query = body.query;
    const accountId = body.accountId;
    const token = await pipelineService.getToken();

    logger.info({
      requestId,
      msg: 'Making query request',
      query,
      accountId
    });

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
      })
    });

    const responseText = await response.text();
    
    logger.info({
      requestId,
      msg: 'Query response received',
      status: response.status,
      response: responseText
    });

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

    return new Response('Failed to process query', { status: 500 });
  }
}