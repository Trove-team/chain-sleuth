import { NextRequest, NextResponse } from 'next/server';
import app from '@/api';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Requested path:', url.pathname); // Add this for debugging

  if (url.pathname === '/api/swagger/json') {
    // @ts-ignore: Swagger method might not be in type definitions
    const swaggerJson = compiledApp.swagger();
    return NextResponse.json(swaggerJson);
  }

  const response = await app.handle(request);
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}