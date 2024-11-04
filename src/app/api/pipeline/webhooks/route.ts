// src/app/api/pipeline/webhooks/route.ts

import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { createLogger } from '@/utils/logger';
import { WebhookData } from '@/types/webhook';
import { MetadataResponse } from '@/types/pipeline';
import { WebhookQueueService } from '@/services/webhookQueueService';

const redis = new Redis(process.env.REDIS_URL || '');
const logger = createLogger('webhook-route');
const webhookQueue = new WebhookQueueService();

interface WebhookResponse {
    success: boolean;
    message?: string;
    webhookId?: string;
    error?: string;
}

export async function POST(request: Request): Promise<NextResponse<WebhookResponse>> {
    try {
        const data = await request.json() as WebhookData;
        logger.info('Received webhook:', data);

        // Add to queue instead of processing immediately
        const webhookId = await webhookQueue.addToQueue(data);

        // Store both task status and metadata if available
        const redisData: Record<string, string> = {
            status: data.status,
            progress: (data.data.progress || 0).toString(),
            message: data.data.message || '',
            error: data.data.error || '',
            lastUpdated: Date.now().toString(),
            accountId: data.data.accountId,
            webhookId
        };

        if (data.data.metadata) {
            redisData.metadata = JSON.stringify(data.data.metadata);
        }

        // Update Redis with latest status and metadata
        await redis.hset(`task:${data.taskId}`, redisData);

        return NextResponse.json({ 
            success: true,
            message: `Webhook queued successfully`,
            webhookId
        });
    } catch (error) {
        logger.error('Webhook processing failed:', error);
        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Webhook processing failed',
                message: 'Webhook processing failed'
            },
            { status: 500 }
        );
    }
}
