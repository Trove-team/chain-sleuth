import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

export async function POST(request: Request) {
    try {
        const { accountId, force } = await request.json();
        const pipelineService = PipelineService.getInstance();
        await pipelineService.initialize();
        
        const result = await pipelineService.startProcessing(accountId, force);
        return NextResponse.json(result, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    } catch (error) {
        console.error('Process error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Processing failed'
        }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
            'Access-Control-Max-Age': '86400'
        }
    });
}