// src/app/api/pipeline/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ 
                error: 'Missing token' 
            }, { status: 400 });
        }

        const status = await pipelineService.checkStatus(params.taskId, token);
        return NextResponse.json(status);
    } catch (error) {
        console.error('Status check failed:', error);
        return NextResponse.json(
            { error: 'Failed to check status' }, 
            { status: 500 }
        );
    }
}