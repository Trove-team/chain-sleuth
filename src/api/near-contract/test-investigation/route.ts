import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { queried_name } = await request.json();
  
  // Generate a unique request ID
  const requestId = `test-${Date.now()}`;

  return NextResponse.json({
    status: 'success',
    requestId,
    message: 'Investigation requested successfully'
  });
}