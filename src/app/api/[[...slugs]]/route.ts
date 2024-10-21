import { NextRequest, NextResponse } from 'next/server';
import app from '@/api';  // Import your Elysia app

export async function GET(request: NextRequest) {
  return app.handle(request);
}

export async function POST(request: NextRequest) {
  return app.handle(request);
}
