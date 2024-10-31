// src/app/api/pipeline/start/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

interface PipelineStartRequest {
  accountId: string;
  requestId?: string;  // Made optional since we might not always need it
  force?: boolean;  // Add this field
}

interface PipelineStartResponse {
  taskId: string;
  status: 'processing' | 'complete';
  data?: {
    robustSummary?: string;
    shortSummary?: string;
  };
  statusLink: string;
}

export async function POST(request: Request) {
    try {
        const { accountId, requestId, force } = await request.json() as PipelineStartRequest;
        
        const processingResult = await pipelineService.startProcessing(accountId, force);
        
        const response: PipelineStartResponse = {
            taskId: processingResult.taskId,
            status: processingResult.existingData ? 'complete' : 'processing',
            statusLink: `/api/pipeline/status/${processingResult.taskId}`,
            ...(processingResult.existingData && { data: processingResult.existingData })
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Pipeline start error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to start pipeline',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}