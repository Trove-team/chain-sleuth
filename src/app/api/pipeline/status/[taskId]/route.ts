// src/app/api/pipeline/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { createLogger } from '@/utils/logger';

const logger = createLogger('status-api');
const pipelineService = new PipelineService();

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const status = await pipelineService.checkStatus(params.taskId);
        return NextResponse.json(status);
    } catch (error) {
        logger.error('Status check failed:', error);
        return NextResponse.json(
            { 
                error: 'Failed to check status',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}