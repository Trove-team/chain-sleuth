import { Queue, QueueOptions, ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { createLogger } from '@/utils/logger';
import { getRedisClient } from '@/utils/redis';
import { MetadataResponse, PipelineStatus } from '@/types';
import crypto from 'crypto';

const logger = createLogger('webhook-queue');

export interface WebhookJobData {
    webhookId?: string;
    taskId: string;
    type: string;
    status: PipelineStatus;
    data: {
        accountId: string;
        metadata?: MetadataResponse;
        progress?: number;
        error?: string;
    };
}

export interface WebhookStatus {
    webhookId: string;
    taskId: string;
    status: 'pending' | 'retrying' | 'delivered' | 'failed';
    attempts?: number;
    lastAttempt?: Date;
    error?: string;
    metadata?: string;
}

export class WebhookQueueService {
    private queue: Queue<WebhookJobData>;
    private redis: Redis;

    constructor() {
        const redis = getRedisClient();
        if (!redis) throw new Error('Redis client not initialized');
        
        this.redis = redis;

        const queueOptions: QueueOptions = {
            connection: redis as unknown as ConnectionOptions,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        };

        this.queue = new Queue<WebhookJobData>('webhooks', queueOptions);
    }

    async addToQueue(webhookData: Omit<WebhookJobData, 'webhookId'>): Promise<string> {
        const webhookId = crypto.randomUUID();
        const fullWebhookData: WebhookJobData = { ...webhookData, webhookId };

        await this.updateWebhookStatus({
            webhookId,
            taskId: webhookData.taskId,
            status: 'pending'
        });

        const job = await this.queue.add('process-webhook', fullWebhookData);
        logger.info(`Added webhook job ${job.id} to queue`);
        return webhookId;
    }

    async updateWebhookStatus(status: WebhookStatus): Promise<void> {
        await this.redis.hset(
            `webhook:${status.webhookId}`,
            {
                ...status,
                lastAttempt: status.lastAttempt
            }
        );
    }
}