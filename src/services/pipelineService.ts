// src/services/pipelineService.ts
interface ProcessingResponse {
    taskId: string;
    existingData?: {
        robustSummary: string;
        shortSummary: string;
    };
}

interface StatusResponse {
    status: 'processing' | 'complete' | 'failed';
    data: {
        accountId: string;
        progress?: number;
        currentStep?: string;
    };
}

export class PipelineService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.NEO4J_API_KEY || '';
        this.baseUrl = process.env.NEO4J_API_URL || '';

        if (!this.apiKey || !this.baseUrl) {
            console.error('Missing API configuration');
        }
    }

    async getToken(): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Auth failed: ${response.status}`);
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Token fetch failed:', error);
            throw new Error('Failed to get authentication token');
        }
    }

    async startProcessing(accountId: string): Promise<ProcessingResponse> {
        try {
            const token = await this.getToken();
            
            const response = await fetch(`${this.baseUrl}/api/v1/account`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accountId,
                    forceReprocess: true,
                    generateSummary: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                taskId: data.data.taskId,
                existingData: data.status === 'exists' ? {
                    robustSummary: data.data.robustSummary,
                    shortSummary: data.data.shortSummary
                } : undefined
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
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Status check failed:', error);
            throw error;
        }
    }

    async getMetadata(accountId: string, token: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/v1/metadata/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

    async getSummaries(accountId: string, token: string): Promise<{
        robustSummary: string | null;
        shortSummary: string | null;
    }> {
        const response = await fetch(`${this.baseUrl}/api/v1/summaries/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch summaries: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            robustSummary: data.robustSummary,
            shortSummary: data.shortSummary
        };
    }
}
