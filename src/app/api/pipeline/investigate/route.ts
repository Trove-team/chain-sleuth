// src/app/api/pipeline/investigate/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export async function POST(request: Request) {
    try {
        const { accountId } = await request.json();
        
        // Get fresh token
        const token = await pipelineService.getToken();
        
        // Start processing
        const { taskId, existingData } = await pipelineService.startProcessing(accountId, token);
        
        if (existingData) {
            return NextResponse.json({
                status: 'complete',
                data: existingData
            });
        }
        
        return NextResponse.json({
            status: 'processing',
            taskId,
            token
        });
    } catch (error) {
        console.error('Investigation failed:', error);
        return NextResponse.json(
            { error: 'Failed to start investigation' }, 
            { status: 500 }
        );
    }
}