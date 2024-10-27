import { NextResponse } from 'next/server';
import { PipelineService } from '../../../services/pipelineService';

const pipelineService = new PipelineService();

export async function POST(request: Request) {
    try {
        const { accountId } = await request.json();
        
        const token = await pipelineService.getToken();
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
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');
        const token = searchParams.get('token');

        if (!taskId || !token) {
            return NextResponse.json({ 
                error: 'Missing taskId or token' 
            }, { status: 400 });
        }

        const status = await pipelineService.checkStatus(taskId, token);
        
        if (status.status === 'complete') {
            const metadata = await pipelineService.getMetadata(status.data.accountId, token);
            return NextResponse.json({
                status: 'complete',
                data: metadata
            });
        }
        
        return NextResponse.json(status);
    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

interface ProgressUpdate {
    taskId: string;
    progress: number;
    status: string;
    currentStep: string;
}

let progressUpdates = new Map<string, ProgressUpdate>();
