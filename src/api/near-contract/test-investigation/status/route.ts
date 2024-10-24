import { NextResponse } from 'next/server';

const STAGES = {
  0: { stage: 'investigation-started', message: 'Investigation started...' },
  1: { stage: 'investigation-in-progress', message: 'Analyzing blockchain data...' },
  2: { stage: 'investigation-complete', message: 'Analysis complete, preparing results...' },
  3: { stage: 'minting', message: 'Minting investigation NFT...' },
  4: { stage: 'complete', message: 'Investigation complete!' }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');
  
  // Simulate progress based on time elapsed
  const startTime = parseInt(requestId!.split('-')[1]);
  const elapsed = Date.now() - startTime;
  const stage = Math.min(Math.floor(elapsed / 3000), 4); // Change stage every 3 seconds

  return NextResponse.json(STAGES[stage as keyof typeof STAGES]);       
}