import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { requestId } = await request.json();
  
  // Simulate the final investigation result
  const mockResult = {
    requestId,
    status: 'complete',
    data: {
      robust_summary: '**Comprehensive Analysis**\nDetailed blockchain analysis...',
      short_summary: 'Account analysis complete with key metrics...'
    }
  };

  return NextResponse.json(mockResult);
}