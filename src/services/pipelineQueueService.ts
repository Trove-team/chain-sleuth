// Path: src/services/pipelineQueueService.ts
import { Queue, QueueOptions, ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { createLogger } from '@/utils/logger';
import { getRedisClient } from '@/utils/redis';
import { ProcessingResponse } from '@/types/pipeline';

const logger = createLogger('pipeline-queue');

export class PipelineQueueService {
    private queue: Queue;
    private redis: Redis | null;

    constructor() {
        this.redis = getRedisClient();
        
        if (!this.redis) {
            throw new Error('Redis client not initialized');
        }

        const queueOptions: QueueOptions = {
            connection: this.redis as unknown as ConnectionOptions,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        };

        this.queue = new Queue('pipeline-processing', queueOptions);
    }

    async addToQueue(accountId: string, force?: boolean): Promise<string> {
        const taskId = crypto.randomUUID();
        
        await this.redis?.hset(`task:${taskId}`, {
            accountId,
            status: 'pending',
            progress: 0,
            createdAt: Date.now()
        });

        await this.queue.add('process-account', {
            taskId,
            accountId,
            force
        });

        return taskId;
    }

    async updateTaskStatus(taskId: string, status: Partial<ProcessingResponse>): Promise<void> {
        await this.redis?.hset(`task:${taskId}`, {
            ...status,
            updatedAt: Date.now()
        });
    }
}