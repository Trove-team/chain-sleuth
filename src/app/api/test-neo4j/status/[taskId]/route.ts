import { Neo4jTestClient } from '@/utils/neo4j-test-client';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    console.log(`Checking status for taskId: ${params.taskId}`);
    const client = new Neo4jTestClient();
    
    // Add cache-busting headers
    const status = await client.checkStatus(params.taskId);
    
    // Log the raw response for debugging
    console.log('Raw API response:', JSON.stringify(status, null, 2));
    
    return Response.json({
      success: true,
      data: {
        status: status.status,
        progress: status.data?.progress || 0,
        currentStep: status.data?.currentStep,
        message: status.message,
        rawResponse: status
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Status check failed:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
