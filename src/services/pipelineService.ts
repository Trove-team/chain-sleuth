// src/services/pipelineService.ts
interface ProcessingResponse {
    taskId: string;
    existingData?: {
        robustSummary: string;
        shortSummary: string;
    };
    status: 'success' | 'error';
    error?: {
        code: string;
        message: string;
        details?: string;
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
        this.baseUrl = 'https://filepile.ai';

        if (!this.apiKey) {
            console.error('API key is missing');
        }
    }

    async getToken(): Promise<string> {
        try {
            console.log('Requesting token from:', `${this.baseUrl}/api/v1/auth/token`);
            
            const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Token response:', response.status, await response.text());
                throw new Error(`Auth failed: ${response.status}`);
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Token fetch failed:', error);
            throw new Error('Failed to get authentication token');
        }
    }

    private createErrorResponse(error: unknown): ProcessingResponse {
        if (error instanceof Error) {
            return {
                taskId: 'error',
                status: 'error',
                error: {
                    code: 'PROCESSING_ERROR',
                    message: error.message,
                    details: error.stack
                }
            };
        }

        if (typeof error === 'string') {
            return {
                taskId: 'error',
                status: 'error',
                error: {
                    code: 'PROCESSING_ERROR',
                    message: error
                }
            };
        }

        return {
            taskId: 'error',
            status: 'error',
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred'
            }
        };
    }

    async startProcessing(accountId: string): Promise<ProcessingResponse> {
        try {
            if (!this.apiKey) {
                throw new Error('API key is not configured');
            }

            const token = await this.getToken();
            
            const response = await fetch(`${this.baseUrl}/api/v1/account`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
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
                } : undefined,
                status: 'success'
            };
        } catch (error) {
            console.error('Processing start failed:', error);
            return this.createErrorResponse(error);
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
