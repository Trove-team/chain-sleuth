// src/app/api/pipeline/metadata/[accountId]/route.ts
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

        const metadata = await pipelineService.getMetadata(params.accountId, token);
        return NextResponse.json(metadata);
    } catch (error) {
        console.error('Metadata fetch failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metadata' }, 
            { status: 500 }
        );
    }
}