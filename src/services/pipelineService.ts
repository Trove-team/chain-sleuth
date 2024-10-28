// src/services/pipelineService.ts
interface ProcessingResponse {
    taskId: string;
    token: string;
    statusLink: string;
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
        this.apiKey = process.env.NEO4J_API_KEY!;
        this.baseUrl = process.env.NEO4J_API_URL!;
        this.wsUrl = process.env.NEO4J_WS_URL!;
    }

    async getToken(): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey
            }
        });
        const data = await response.json();
        return data.token;
    }

    async startProcessing(accountId: string, token: string): Promise<ProcessingResponse> {
        try {
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
                token,
                statusLink: data.data.statusLink,
                existingData: data.status === 'exists' ? {
                    robustSummary: data.data.robustSummary,
                    shortSummary: data.data.shortSummary
                } : undefined
            };
        } catch (error) {
            console.error('Pipeline processing error:', error);
            throw error;
        }
    }

    async checkStatus(taskId: string, token: string): Promise<StatusResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/status/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

    async getMetadata(accountId: string, token: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/v1/metadata/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }

    setupWebSocket(taskId: string): WebSocket {
        const ws = new WebSocket(`${this.wsUrl}/api/v1/ws/${taskId}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Handle progress updates
        };

        return ws;
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
