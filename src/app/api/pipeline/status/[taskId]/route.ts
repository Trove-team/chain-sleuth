// src/app/api/pipeline/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { InvestigationWorkflow } from '@/services/investigationWorkflow';
import { createLogger } from '@/utils/logger';

const logger = createLogger('status-api');
const pipelineService = new PipelineService();
const workflow = new InvestigationWorkflow();

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const [pipelineStatus, workflowState] = await Promise.all([
            pipelineService.checkStatus(params.taskId, token),
            workflow.getStateByTaskId(params.taskId)
        ]);

        return NextResponse.json({
            ...pipelineStatus,
            requestId: workflowState?.requestId,
            stage: workflowState?.stage
        });
    } catch (error) {
        logger.error('Status check failed', error);
        return NextResponse.json(
            { error: 'Failed to check status' },
            { status: 500 }
        );
    }
}