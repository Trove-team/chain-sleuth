import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';
import { StatusResponse } from '@/types/pipeline';

const pipelineService = new PipelineService();

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    const taskId = params.taskId;
    console.log('Received SSE request for taskId:', taskId);

    const encoder = new TextEncoder();

    const customHeaders = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const stream = new ReadableStream({
        async start(controller: ReadableStreamDefaultController) {
            try {
                const status: StatusResponse = await pipelineService.checkStatus(taskId);
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
                );

                if (status.status === 'complete' || status.status === 'failed') {
                    controller.close();
                    return;
                }

                let intervalId: NodeJS.Timeout;
                intervalId = setInterval(async () => {
                    try {
                        const status: StatusResponse = await pipelineService.checkStatus(taskId);
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
                        );

                        if (status.status === 'complete' || status.status === 'failed') {
                            clearInterval(intervalId);
                            controller.close();
                        }
                    } catch (error) {
                        console.error('Error checking status:', error);
                        clearInterval(intervalId);
                        controller.close();
                    }
                }, 5000);

                return () => {
                    clearInterval(intervalId);
                };
            } catch (error) {
                console.error('Error in SSE stream:', error);
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: customHeaders,
    });
}