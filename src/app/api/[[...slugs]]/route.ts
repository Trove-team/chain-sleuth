import { NextRequest } from 'next/server';
import app from '@/api';

export async function GET(request: NextRequest) {
  return app.handle(request);
}

export async function POST(request: NextRequest) {
  return app.handle(request);
}

// Add other methods if needed
export const dynamic = 'force-dynamic';
