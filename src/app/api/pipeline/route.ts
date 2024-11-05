import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { ProcessingResponse, StatusResponse } from '@/types/pipeline';

export async function GET(request: Request) {
    try {
        const pipelineService = PipelineService.getInstance();
        await pipelineService.initialize();
        
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            const response: ProcessingResponse = {
                taskId: '',
                status: 'error',
                error: {
                    code: 'MISSING_TASK_ID',
                    message: 'Missing taskId parameter'
                }
            };
            return NextResponse.json(response, { status: 400 });
        }

        const status = await pipelineService.checkStatus(taskId);
        return NextResponse.json(status, {
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    } catch (error) {
        console.error('Pipeline GET error:', error);
        const response: ProcessingResponse = {
            taskId: '',
            status: 'error',
            error: {
                code: 'STATUS_CHECK_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
        return NextResponse.json(response, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    }
}

export async function POST(request: Request) {
    try {
        const pipelineService = PipelineService.getInstance();
        await pipelineService.initialize();
        
        const { accountId, force } = await request.json();
        
        if (!accountId) {
            return NextResponse.json({
                error: 'Account ID is required'
            }, { 
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
                }
            });
        }

        const result = await pipelineService.startProcessing(accountId, force);
        return NextResponse.json(result, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Processing failed'
        }, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    }
}

export async function OPTIONS(request: Request) {
    // Handle preflight request
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
            'Access-Control-Max-Age': '86400' // 24 hours
        }
    });
}

interface ProgressUpdate {
    taskId: string;
    progress: number;
    status: string;
    currentStep: string;
}

let progressUpdates = new Map<string, ProgressUpdate>();
