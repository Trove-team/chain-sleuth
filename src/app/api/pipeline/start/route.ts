// src/app/api/pipeline/start/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { ProcessingResponse } from '@/types/pipeline';

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
        const { accountId, force } = await request.json();
        
        if (!accountId?.trim()) {
            return NextResponse.json({ 
                taskId: 'error',
                status: 'failed',
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Valid accountId is required'
                }
            } as ProcessingResponse, { status: 400 });
        }
        
        const processingResult = await pipelineService.startProcessing(accountId, force);
        return NextResponse.json(processingResult);
    } catch (error) {
        console.error('Pipeline start error:', error);
        return NextResponse.json({ 
            taskId: 'error',
            status: 'failed',
            error: {
                code: 'PROCESSING_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        } as ProcessingResponse, { status: 500 });
    }
}