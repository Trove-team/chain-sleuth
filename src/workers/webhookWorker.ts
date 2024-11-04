import { Worker, Job, ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { WebhookQueueService } from '../services/webhookQueueService';
import { createLogger } from '../utils/logger';
import { WebhookData } from '../types/webhook';
import { getRedisClient } from '../utils/redis';
import { WebSocketService } from '../services/webSocketService';

const logger = createLogger('webhook-worker');
const webhookQueue = new WebhookQueueService();
const redis = getRedisClient();
const wsService = WebSocketService.getInstance();

if (!redis) {
    throw new Error('Redis client not initialized');
}

interface WebhookJobData extends WebhookData {
    webhookId: string;
}

const worker = new Worker<WebhookJobData>('webhooks', async (job: Job<WebhookJobData>) => {
    const { webhookId, ...webhookData } = job.data;

    try {
        // Update status to retrying
        await webhookQueue.updateWebhookStatus({
            webhookId,
            taskId: webhookData.taskId,
            status: 'retrying',
            attempts: job.attemptsMade,
            lastAttempt: new Date(),
            metadata: webhookData.data.metadata ? JSON.stringify(webhookData.data.metadata) : undefined
        });

        // Process webhook data
        if (webhookData.status === 'complete' && webhookData.data.metadata) {
            await redis.hset(`account:${webhookData.data.accountId}`, {
                metadata: JSON.stringify(webhookData.data.metadata),
                lastUpdated: Date.now().toString()
            });
        }

        // Update status to delivered
        await webhookQueue.updateWebhookStatus({
            webhookId,
            taskId: webhookData.taskId,
            status: 'delivered',
            attempts: job.attemptsMade,
            lastAttempt: new Date(),
            metadata: webhookData.data.metadata ? JSON.stringify(webhookData.data.metadata) : undefined
        });

        wsService.broadcast(webhookData);

    } catch (error) {
        logger.error('Webhook processing failed:', error);
        
        await webhookQueue.updateWebhookStatus({
            webhookId,
            taskId: webhookData.taskId,
            status: 'failed',
            attempts: job.attemptsMade,
            lastAttempt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw error;
    }
}, {
    connection: redis as unknown as ConnectionOptions
});

worker.on('completed', (job: Job<WebhookJobData>) => {
    logger.info(`Webhook ${job.data.webhookId} processed successfully`);
});

worker.on('failed', (job: Job<WebhookJobData> | undefined, error: Error) => {
    if (job) {
        logger.error(`Webhook ${job.data.webhookId} failed:`, error);
    } else {
        logger.error('Webhook job failed:', error);
    }
});
