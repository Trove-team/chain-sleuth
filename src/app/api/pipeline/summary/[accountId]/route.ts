// src/app/api/pipeline/summary/[accountId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

export async function GET(
    request: Request,
    { params }: { params: { accountId: string } }
) {
    try {
        const pipelineService = PipelineService.getInstance();
        await pipelineService.initialize();
        const summaries = await pipelineService.getSummaries(params.accountId);
        return NextResponse.json(summaries);
    } catch (error) {
        console.error('Summary fetch failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch summaries' }, 
            { status: 500 }
        );
    }
}