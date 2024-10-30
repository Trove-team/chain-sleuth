import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/utils/logger';
import { PipelineService } from '@/services/pipelineService';

const logger = createLogger('query-engine-nextjs');
const pipelineService = new PipelineService();

export async function POST(request: Request) {
  const requestId = uuidv4();
  
  try {
    // Pino structured logging
    logger.info({
      requestId,
      msg: 'Environment check',
      hasApiKey: !!process.env.NEO4J_API_KEY,
      hasApiUrl: !!process.env.NEO4J_API_URL,
      apiUrl: process.env.NEO4J_API_URL
    });

    const { query, accountId } = await request.json();
    logger.info({
      requestId,
      msg: 'Request parsed',
      query,
      accountId
    });
    
    let token;
    try {
      token = await pipelineService.getToken();
      logger.info({ requestId, msg: 'Token acquired successfully' });
    } catch (tokenError) {
      logger.error({
        requestId,
        msg: 'Token acquisition failed',
        error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      });
      throw tokenError;
    }

    if (!process.env.NEO4J_API_URL) {
      throw new Error('NEO4J_API_URL environment variable is not set');
    }

    logger.info({
      requestId,
      msg: 'Making Neo4j request',
      url: `${process.env.NEO4J_API_URL}/query`,
      hasToken: !!token
    });

    const response = await fetch(`${process.env.NEO4J_API_URL}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({ query })
    });

    logger.info({
      requestId,
      msg: 'Neo4j response received',
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({
        requestId,
        msg: 'Neo4j error response',
        status: response.status,
        error: errorText
      });
      throw new Error(`Neo4j API responded with ${response.status}: ${errorText}`);
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
      { 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}