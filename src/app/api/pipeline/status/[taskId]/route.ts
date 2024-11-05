// src/app/api/pipeline/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { createLogger } from '@/utils/logger';

const logger = createLogger('status-api');

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const pipelineService = PipelineService.getInstance();
        await pipelineService.initialize();
        const status = await pipelineService.checkStatus(params.taskId);
        return NextResponse.json(status, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    } catch (error) {
        logger.error('Status check failed:', error);
        return NextResponse.json({ 
            status: 'error',
            error: {
                code: 'STATUS_CHECK_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
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