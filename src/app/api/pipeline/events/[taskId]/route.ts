import { EdgePipelineService } from '@/services/edgePipelineService';
import { NextResponse } from 'next/server';

const pipelineService = new EdgePipelineService();
const encoder = new TextEncoder();

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    const taskId = params.taskId;

    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
    });

    try {
        // Create a ReadableStream with a controller
        const stream = new ReadableStream({
            start: async (controller) => {
                try {
                    // Initial status check
                    const initialStatus = await pipelineService.checkStatus(taskId);
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(initialStatus)}\n\n`)
                    );

                    if (initialStatus.status === 'complete' || initialStatus.status === 'failed') {
                        controller.close();
                        return;
                    }

                    // Set up polling
                    const poll = async () => {
                        try {
                            const status = await pipelineService.checkStatus(taskId);
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
                            );

                            if (status.status === 'complete' || status.status === 'failed') {
                                controller.close();
                                return;
                            }

                            // Schedule next poll
                            setTimeout(poll, 5000);
                        } catch (error) {
                            console.error('Polling error:', error);
                            controller.error(error);
                        }
                    };

                    // Start polling
                    setTimeout(poll, 5000);

                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                }
            }
        });

        return new Response(stream, { headers });

    } catch (error) {
        console.error('SSE setup error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to setup SSE connection' }), 
            { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    }
}