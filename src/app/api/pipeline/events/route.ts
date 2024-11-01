import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

const pipelineService = new PipelineService();

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    const taskId = params.taskId;

    // Set up SSE headers
    const encoder = new TextEncoder();
    const customHeaders = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Initial status check
                const status = await pipelineService.checkStatus(taskId);
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
                );

                // If already complete, close the stream
                if (status.status === 'complete' || status.status === 'failed') {
                    controller.close();
                    return;
                }

                // Set up polling interval
                const interval = setInterval(async () => {
                    try {
                        const status = await pipelineService.checkStatus(taskId);
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
                        );

                        if (status.status === 'complete' || status.status === 'failed') {
                            clearInterval(interval);
                            controller.close();
                        }
                    } catch (error) {
                        console.error('Error checking status:', error);
                        clearInterval(interval);
                        controller.close();
                    }
                }, 5000); // Poll every 5 seconds

                // Clean up on stream end
                return () => {
                    clearInterval(interval);
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