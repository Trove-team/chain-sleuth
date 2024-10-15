// File: src/app/api/[[...slugs]]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import app from '@/api';

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url);
  const response = await app.handle(request);
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export const POST = async (request: NextRequest) => {
  const url = new URL(request.url);
  const response = await app.handle(request);
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
