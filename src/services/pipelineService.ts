// src/services/pipelineService.ts
// Export the interfaces
export interface ProcessingResponse {
    taskId: string;
    status: 'processing' | 'complete' | 'failed' | 'exists';
    existingData?: {
        robustSummary: string;
        shortSummary: string;
    };
    error?: {
        code: string;
        message: string;
        details?: string;
    };
}

export interface StatusResponse {
    status: 'processing' | 'complete' | 'failed';
    data: {
        accountId: string;
        progress?: number;
        currentStep?: string;
        error?: string;
    };
}

export class PipelineService {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = process.env.NEO4J_API_URL || 'https://filepile.ai';
        this.apiKey = process.env.NEO4J_API_KEY || '';
    }

    async getToken(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/auth/token`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data.token;
    }

    private createErrorResponse(error: Error | string | unknown): ProcessingResponse {
        if (error instanceof Error) {
            return {
                taskId: 'error',
                status: 'failed',
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
                status: 'failed',
                error: {
                    code: 'PROCESSING_ERROR',
                    message: error
                }
            };
        }

        return {
            taskId: 'error',
            status: 'failed',
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred'
            }
        };
    }

    async startProcessing(accountId: string, force?: boolean): Promise<ProcessingResponse> {
        if (!accountId?.trim()) {
            throw new Error('Valid accountId is required');
        }

        try {
            console.log('Starting processing for account:', accountId);
            const token = await this.getToken();
            const response = await fetch(`${this.baseUrl}/account`, {
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
                throw new Error(`Processing failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Processing response:', data);
            return data;
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
