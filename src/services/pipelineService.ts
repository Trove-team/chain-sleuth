// src/services/pipelineService.ts
// Export the interfaces
export interface ProcessingResponse {
    taskId: string;
    status: 'processing' | 'complete' | 'failed' | 'exists';
    message?: string;
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

// Add this helper function at the top of the file
function generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

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
            const errorBody = await response.text();
            throw new Error(`Failed to get token: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
        }

        const data = await response.json();
        return data.token;
    }

    async startProcessing(accountId: string, force?: boolean): Promise<ProcessingResponse> {
        if (!accountId?.trim()) {
            throw new Error('Valid accountId is required');
        }

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

            // Ensure we have a properly typed response
            const processingResponse: ProcessingResponse = {
                taskId: data.taskId || generateTaskId(), // Fallback to generated ID if API doesn't provide one
                status: 'processing',
                message: 'Processing started',
                existingData: data.existingData
            };

            return processingResponse;
        } catch (error) {
            console.error('Processing start failed:', error);
            const errorResponse: ProcessingResponse = {
                taskId: generateTaskId(),
                status: 'failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                error: {
                    code: 'PROCESSING_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
            throw errorResponse;
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
