// src/app/api/pipeline/metadata/[accountId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = PipelineService.getInstance();

export async function GET(
    request: Request,
    { params }: { params: { accountId: string } }
) {
    try {
        await pipelineService.initialize();
        const metadata = await pipelineService.getMetadata(params.accountId);
        return NextResponse.json(metadata, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    } catch (error) {
        console.error('Metadata fetch error:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch metadata',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
            'Access-Control-Max-Age': '86400'
        }
    });
}