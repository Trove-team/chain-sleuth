// src/app/api/pipeline/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { createLogger } from '@/utils/logger';
import { StatusResponse, StatusUpdate } from '@/types';

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
                status: 'failed',
                data: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            } as StatusResponse,
            { status: error instanceof Error && error.message === 'Task not found' ? 404 : 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const body = await request.json() as StatusUpdate;
        await pipelineService.updateStatus(params.taskId, body);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Status update failed:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}