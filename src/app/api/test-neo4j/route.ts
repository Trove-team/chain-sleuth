import { Neo4jTestClient } from '@/utils/neo4j-test-client';

export async function GET(request: Request) {
  console.log('\n=== Starting Neo4j API Test ===');
  console.log('Environment check:');
  console.log('NEO4J_API_URL configured:', !!process.env.NEO4J_API_URL);
  console.log('NEO4J_API_KEY configured:', !!process.env.NEO4J_API_KEY);
  
  try {
    const client = new Neo4jTestClient();
    const testAccount = 'bpr1.near';
    
    // First test the connection
    console.log('\nTesting connection...');
    const isConnected = await client.testConnection();
    
    if (!isConnected) {
      return Response.json({ 
        success: false, 
        error: 'Failed to connect to Neo4j API' 
      }, { status: 500 });
    }

    // Start processing
    console.log('Starting processing for:', testAccount);
    const initResponse = await client.initiateProcessing(testAccount);
    
    if (initResponse.status === 'exists') {
      return Response.json({
        success: true,
        message: 'Account already processed',
        data: {
          ...initResponse.data,
          exists: true
        }
      });
    }
    
    // Return taskId for new processing
    return Response.json({
      success: true,
      message: 'Processing started',
      data: {
        taskId: initResponse.data.taskId,
        accountId: testAccount,
        statusEndpoint: `/api/test-neo4j/status/${initResponse.data.taskId}`,
        exists: false
      }
    });

  } catch (error) {
    console.error('Test failed:', error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
