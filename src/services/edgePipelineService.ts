import { StatusResponse, ProcessingResponse } from '@/types/pipeline';
import crypto from 'crypto';

export class EdgePipelineService {
    private baseUrl: string;
    private clientId: string;
    private clientSecret: string;

    constructor() {
        this.baseUrl = process.env.NEO4J_API_URL || 'https://filepile.ai';
        this.clientId = 'chainsleuth';
        this.clientSecret = process.env.NEO4J_API_KEY || '';
    }

    async checkStatus(taskId: string): Promise<StatusResponse> {
        try {
            const token = await this.getToken();
            const response = await fetch(`${this.baseUrl}/api/v1/status/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Status check failed:', error);
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
}