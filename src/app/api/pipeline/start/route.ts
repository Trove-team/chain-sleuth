// src/app/api/pipeline/start/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export async function POST(request: Request) {
    try {
        const { accountId, requestId } = await request.json();
        
        // Get token and start processing
        const token = await pipelineService.getToken();
        const processingResult = await pipelineService.startProcessing(accountId, token);
        
        // Link request ID with task ID in your database if needed
        // await db.linkRequestToTask(requestId, processingResult.taskId);
        
        return NextResponse.json({
            taskId: processingResult.taskId,
            token,
            statusLink: processingResult.statusLink
        });
    } catch (error) {
        console.error('Pipeline start error:', error);
        return NextResponse.json(
            { error: 'Failed to start pipeline' },
            { status: 500 }
        );
    }
}