// src/app/api/pipeline/metadata/[accountId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export async function GET(
    request: Request,
    { params }: { params: { accountId: string } }
) {
    try {
        if (!params.accountId) {
            return NextResponse.json(
                { error: 'Account ID is required' },
                { status: 400 }
            );
        }

        const metadata = await pipelineService.getMetadata(params.accountId);
        return NextResponse.json(metadata);
    } catch (error) {
        console.error('Metadata fetch failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metadata' },
            { status: 500 }
        );
    }
}