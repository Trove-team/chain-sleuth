// src/app/api/pipeline/summary/[accountId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export async function GET(
    request: Request,
    { params }: { params: { accountId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ 
                error: 'Missing token' 
            }, { status: 400 });
        }

        // Keep passing the token to maintain Neo4j communication
        const summaries = await pipelineService.getSummaries(params.accountId, token);
        return NextResponse.json(summaries);
    } catch (error) {
        console.error('Summary fetch failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch summaries' }, 
            { status: 500 }
        );
    }
}