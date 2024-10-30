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
      query
    });

    const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId
      },
      body: JSON.stringify({ 
        query: query,
        accountId: accountId
      })
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorText = await response.text();
        // Try to parse as JSON first
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch (parseError) {
          // If JSON parsing fails, log the parse error without referencing undefined 'error'
          logger.error({
            requestId,
            msg: 'Failed to parse error response',
            status: response.status,
            parseError,
            rawResponse: errorText  // Include the raw response instead of undefined error
          });
          
          errorMessage = errorText; // Use the raw error text
        }
        
        logger.error({
          requestId,
          msg: 'Query error response',
          status: response.status,
          error: errorMessage,
          rawResponse: errorText
        });
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      } catch (fetchError) {
        logger.error({
          requestId,
          msg: 'Failed to read error response',
          status: response.status,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        });
        
        return NextResponse.json(
          { error: 'An unexpected error occurred' },
          { status: 500 }
        );
      }
    }

    try {
      const data = await response.json();
      logger.info({
        requestId,
        msg: 'Query completed successfully',
        status: response.status
      });
      
      return NextResponse.json(data);
    } catch (parseError) {
      logger.error({
        requestId,
        msg: 'Failed to parse successful response',
        error: parseError
      });
      
      return NextResponse.json(
        { error: 'Failed to parse API response' },
        { status: 500 }
      );
    }

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