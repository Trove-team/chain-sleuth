// File: src/app/api/[[...slugs]]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import app from '@/api';

async function handler(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname === '/api/swagger/json') {
    // @ts-ignore: Swagger method might not be in type definitions
    const swaggerJson = app.swagger();
    return NextResponse.json(swaggerJson);
  }
  const response = await app.handle(request);
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export const GET = handler;
export const POST = handler;
