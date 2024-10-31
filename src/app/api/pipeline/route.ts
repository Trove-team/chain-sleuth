import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            return NextResponse.json({ 
                error: 'Missing taskId' 
            }, { status: 400 });
        }

        const status = await pipelineService.checkStatus(taskId);
        return NextResponse.json(status);
        
    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { accountId } = await request.json();
        
        if (!accountId) {
            return NextResponse.json({ 
                error: 'Missing accountId' 
            }, { status: 400 });
        }

        const result = await pipelineService.startProcessing(accountId);
        return NextResponse.json(result);
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
