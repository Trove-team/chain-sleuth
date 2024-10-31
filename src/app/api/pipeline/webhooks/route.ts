// src/app/api/pipeline/webhooks/route.ts

import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { createLogger } from '@/utils/logger';

const redis = new Redis(process.env.REDIS_URL || '');
const logger = createLogger('webhook-route');

interface WebhookData {
    taskId: string;
    status: 'processing' | 'complete' | 'failed';
    progress?: number;
    message?: string;
    error?: string;
    accountId: string;
}

export async function POST(request: Request) {
    try {
        const data = await request.json() as WebhookData;
        logger.info('Received webhook:', data);

        // Update Redis with latest status
        await redis.hset(`task:${data.taskId}`, {
            status: data.status,
            progress: data.progress || 0,
            message: data.message || '',
            error: data.error || '',
            lastUpdated: Date.now().toString(),
            accountId: data.accountId
        });

        // If complete or failed, we can clean up any temporary data
        if (data.status === 'complete' || data.status === 'failed') {
            logger.info(`Processing ${data.status} for task ${data.taskId}`);
        }

        return NextResponse.json({ 
            success: true,
            message: `Successfully processed ${data.status} webhook`
        });
    } catch (error) {
        logger.error('Webhook processing failed:', error);
        return NextResponse.json(
            { 
                error: 'Webhook processing failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
