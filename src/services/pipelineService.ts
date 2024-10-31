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
    private wsUrl: string;

    constructor() {
        if (!process.env.NEO4J_API_KEY || !process.env.NEO4J_API_URL) {
            throw new Error('Missing required environment variables');
        }
        
        this.apiKey = process.env.NEO4J_API_KEY;
        this.baseUrl = process.env.NEO4J_API_URL.replace(/\/$/, ''); // Remove trailing slash if present
        this.wsUrl = process.env.NEO4J_WS_URL || this.baseUrl.replace('http', 'ws');
    }

    async getToken(): Promise<string> {
        try {
            // Make sure we're using the correct endpoint path
            const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify({}) // Add any required payload
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Auth failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.token) {
                throw new Error('Token not found in response');
            }

            return data.token;
        } catch (error) {
            console.error('Token fetch failed:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to get authentication token');
        }
    }

    async startProcessing(accountId: string): Promise<ProcessingResponse> {
        try {
            const token = await this.getToken();
            
            if (!token) {
                throw new Error('Failed to get authentication token');
            }

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
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
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

    setupWebSocket(taskId: string): WebSocket | null {
        if (typeof window === 'undefined' || !this.wsUrl) {
            console.warn('WebSocket setup skipped: not in browser or missing URL');
            return null;
        }

        try {
            const ws = new WebSocket(`${this.wsUrl}/api/v1/ws/${taskId}`);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return ws;
        } catch (error) {
            console.error('WebSocket setup failed:', error);
            return null;
        }
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
