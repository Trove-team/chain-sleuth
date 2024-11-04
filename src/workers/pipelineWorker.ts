// Path: src/workers/pipelineWorker.ts
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { createLogger } from '@/utils/logger';
import { getRedisClient } from '@/utils/redis';
import { PipelineService } from '@/services/pipelineService';
import { WebhookQueueService, WebhookJobData } from '@/services/webhookQueueService';
import { MetadataResponse, PipelineStatus } from '@/types';

interface PipelineJobData {
    taskId: string;
    accountId: string;
    force?: boolean;
}

const logger = createLogger('pipeline-worker');
const redis = getRedisClient();
const pipelineService = new PipelineService();
const webhookQueue = new WebhookQueueService();

if (!redis) {
    throw new Error('Redis client not initialized');
}

const worker = new Worker<PipelineJobData>('pipeline-processing', async (job) => {
    const { taskId, accountId, force } = job.data;

    try {
        await pipelineService.updateStatus(taskId, {
            status: 'processing',
            progress: 0,
            currentStep: 'Starting pipeline'
        });

        const result = await pipelineService.processAccount(accountId, force);

        const webhookData: WebhookJobData = {
            taskId,
            type: 'AccountProcessed',
            status: 'complete',
            data: {
                accountId,
                metadata: result,
                progress: 100
            }
        };

        await webhookQueue.addToQueue(webhookData);

        await pipelineService.updateStatus(taskId, {
            status: 'complete',
            progress: 100,
            metadata: result
        });

    } catch (error) {
        logger.error('Pipeline processing failed:', error);
        
        await pipelineService.updateStatus(taskId, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        throw error;
    }
}, {
    connection: redis as unknown as ConnectionOptions
});

worker.on('completed', (job) => {
    logger.info(`Pipeline job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
    logger.error(`Pipeline job ${job?.id} failed:`, error);
});

export default worker;