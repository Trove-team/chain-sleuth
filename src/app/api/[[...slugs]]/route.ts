// File: src/app/api/[[...slugs]]/route.ts

import { NextRequest } from 'next/server';
import app from '@/api';

export const GET = async (request: NextRequest) => {
  return app.handle(request);
}

export const POST = async (request: NextRequest) => {
  return app.handle(request);
}