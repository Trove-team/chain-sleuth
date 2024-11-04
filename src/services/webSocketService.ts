import { Redis } from 'ioredis';
import { createLogger } from '../utils/logger';
import { getRedisClient } from '../utils/redis';
import { WebSocketMessage } from '../types/websocket';
import { WebhookData, WebhookType } from '../types/webhook';

// Add WebSocket type definition since it's not available in Node.js
declare class WebSocket {
    static readonly OPEN: number;
    readyState: number;
    send(data: string): void;
    close(): void;
}

const logger = createLogger('websocket-service');

export class WebSocketService {
    private static instance: WebSocketService;
    private clients: Map<string, Set<WebSocket>>;
    private redis: Redis | null;

    private constructor() {
        this.clients = new Map();
        this.redis = getRedisClient();
        
        if (!this.redis) {
            throw new Error('Redis client not initialized');
        }
    }

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    addClient(taskId: string, ws: WebSocket): void {
        if (!this.clients.has(taskId)) {
            this.clients.set(taskId, new Set());
        }
        this.clients.get(taskId)?.add(ws);
        
        // Send initial status if exists
        this.sendInitialStatus(taskId, ws).catch(error => {
            logger.error('Error sending initial status:', error);
        });
    }

    private async sendInitialStatus(taskId: string, ws: WebSocket): Promise<void> {
        if (!this.redis) return;

        const status = await this.redis.hgetall(`task:${taskId}`);
        if (status && Object.keys(status).length > 0) {
            const message: WebSocketMessage = {
                type: status.type as WebhookType || 'Progress',
                taskId,
                data: {
                    progress: parseInt(status.progress || '0'),
                    accountId: status.accountId,
                    currentStep: status.currentStep,
                    metadata: status.metadata ? JSON.parse(status.metadata) : undefined,
                    error: status.error
                }
            };
            ws.send(JSON.stringify(message));
        }
    }

    removeClient(taskId: string, ws: WebSocket): void {
        this.clients.get(taskId)?.delete(ws);
        if (this.clients.get(taskId)?.size === 0) {
            this.clients.delete(taskId);
        }
    }

    broadcast(webhookData: WebhookData): void {
        const clients = this.clients.get(webhookData.taskId);
        if (!clients) return;

        const message: WebSocketMessage = {
            type: webhookData.type,
            taskId: webhookData.taskId,
            data: webhookData.data
        };

        const messageStr = JSON.stringify(message);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
}