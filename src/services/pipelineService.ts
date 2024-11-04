// src/services/pipelineService.ts
// Export the interfaces
import { ProcessingResponse, StatusResponse, MetadataResponse, StatusUpdate, PipelineStatus } from '@/types';
import { Redis } from 'ioredis';
import crypto from 'crypto';
import { PipelineQueueService } from './pipelineQueueService';
import { WebhookQueueService } from './webhookQueueService';
import { createLogger } from '@/utils/logger';
import { getRedisClient } from '@/utils/redis';

const logger = createLogger('pipeline-service');

export class PipelineService {
    private pipelineQueue: PipelineQueueService;
    private webhookQueue: WebhookQueueService;
    private redis: Redis;
    private baseUrl: string;
    private clientSecret: string;

    constructor() {
        const redis = getRedisClient();
        if (!redis) {
            throw new Error('Redis client not initialized');
        }
        
        this.redis = redis;
        this.pipelineQueue = new PipelineQueueService();
        this.webhookQueue = new WebhookQueueService();
        this.baseUrl = process.env.API_BASE_URL || '';
        this.clientSecret = process.env.API_CLIENT_SECRET || '';
    }

    async checkStatus(taskId: string): Promise<StatusResponse> {
        try {
            const status = await this.redis.hgetall(`task:${taskId}`);
            
            if (!status || Object.keys(status).length === 0) {
                throw new Error('Task not found');
            }

            return {
                status: status.status as PipelineStatus,
                data: {
                    accountId: status.accountId,
                    progress: parseInt(status.progress || '0'),
                    currentStep: status.currentStep,
                    error: status.error,
                    taskId,
                    metadata: status.metadata ? JSON.parse(status.metadata) : undefined
                }
            };
        } catch (error) {
            logger.error('Status check failed:', error);
            throw error;
        }
    }

    async getToken(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.clientSecret
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get auth token');
        }

        const data = await response.json();
        return data.token;
    }

    async startProcessing(accountId: string, force?: boolean): Promise<ProcessingResponse> {
        try {
            const taskId = await this.pipelineQueue.addToQueue(accountId, force);

            const response: ProcessingResponse = {
                taskId,
                status: 'processing',
                statusLink: `/api/pipeline/status/${taskId}`,
                data: {
                    progress: 0
                }
            };

            // Optionally notify webhook about processing start
            await this.webhookQueue.addToQueue({
                taskId,
                type: 'ProcessingStarted',
                status: 'processing',
                data: {
                    accountId,
                    progress: 0
                }
            });

            return response;
        } catch (error) {
            logger.error('Failed to start processing:', error);
            
            const errorResponse: ProcessingResponse = {
                taskId: crypto.randomUUID(), // Generate an error taskId
                status: 'failed',
                data: {
                    error: {
                        code: 'PROCESSING_START_FAILED',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                }
            };

            throw errorResponse;
        }
    }

    async getMetadata(accountId: string): Promise<MetadataResponse> {
        const token = await this.getToken();
        const response = await fetch(`${this.baseUrl}/api/v1/metadata/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        return response.json();
    }

    async getSummaries(accountId: string, token: string): Promise<{
        robustSummary: string | null;
        shortSummary: string | null;
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/account/${accountId}/summaries`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Summary fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                robustSummary: data.robustSummary,
                shortSummary: data.shortSummary
            };
        } catch (error) {
            console.error('Failed to fetch summaries:', error);
            throw error;
        }
    }

    async updateStatus(taskId: string, update: StatusUpdate): Promise<void> {
        try {
            const currentStatus = await this.redis.hgetall(`task:${taskId}`);
            
            if (!currentStatus || Object.keys(currentStatus).length === 0) {
                throw new Error('Task not found');
            }

            const updatedStatus = {
                ...currentStatus,
                ...update,
                updatedAt: Date.now().toString(),
                metadata: update.metadata ? JSON.stringify(update.metadata) : currentStatus.metadata
            };

            await this.redis.hset(`task:${taskId}`, updatedStatus);
        } catch (error) {
            logger.error('Status update failed:', error);
            throw error;
        }
    }

    async processAccount(accountId: string, force?: boolean): Promise<MetadataResponse> {
        try {
            const token = await this.getToken();
            
            // Get metadata and summaries in parallel
            const [metadata, summaries] = await Promise.all([
                this.getMetadata(accountId),
                this.getSummaries(accountId, token)
            ]);

            return {
                ...metadata,
                robustSummary: summaries.robustSummary || undefined,
                shortSummary: summaries.shortSummary || undefined
            };
        } catch (error) {
            logger.error('Account processing failed:', error);
            throw error;
        }
    }
}
