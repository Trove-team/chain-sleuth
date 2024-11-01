// src/services/pipelineService.ts
// Export the interfaces
import { ProcessingResponse, StatusResponse, MetadataResponse } from '@/types/pipeline';

export class PipelineService {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = process.env.NEO4J_API_URL || '';
        this.apiKey = process.env.NEO4J_API_KEY || '';
        
        if (!this.baseUrl) throw new Error('NEO4J_API_URL is not configured');
        if (!this.apiKey) throw new Error('NEO4J_API_KEY is not configured');
        
        // Add connection verification
        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            const token = await this.getToken();
            console.log('API Connection verified successfully');
            return true;
        } catch (error) {
            console.error('API Connection failed:', error);
            return false;
        }
    }

    async getToken(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
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
            console.log('Starting processing for account:', accountId);
            const token = await this.getToken();
            const response = await fetch(`${this.baseUrl}/api/v1/account`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    accountId: accountId.trim(),
                    force: force || false 
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Processing failed: ${response.status}\nBody: ${errorBody}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // Server returns taskId format like: d2057d16-e33e-4fac-bc9c-aee715ca876e
            if (!data.taskId) {
                throw new Error('No taskId received from server');
            }

            return {
                taskId: data.taskId,
                status: 'processing',
                message: 'Processing started',
                existingData: data.existingData,
                data: {
                    robustSummary: data.existingData?.robustSummary,
                    shortSummary: data.existingData?.shortSummary
                },
                statusLink: `/api/pipeline/events/${data.taskId}`
            };
        } catch (error) {
            console.error('Processing start failed:', error);
            throw error;
        }
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
                const errorBody = await response.text();
                throw new Error(`Status check failed: ${response.status}\nBody: ${errorBody}`);
            }

            const data = await response.json();
            console.log('Status response:', JSON.stringify(data, null, 2));
            return data;
        } catch (error) {
            console.error('Status check failed:', error);
            throw error;
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
}
