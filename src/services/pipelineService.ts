// src/services/pipelineService.ts
// Export the interfaces
import { ProcessingResponse, StatusResponse, MetadataResponse, QueryResult } from '@/types/pipeline';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Define the interface for type-safety
interface PipelineServiceEvents {
  progressUpdate: (progress: number) => void;
  processingComplete: (result: QueryResult) => void;
}

// Extend EventEmitter with our typed events
export class PipelineService extends EventEmitter {
    private static instance: PipelineService;
    private baseUrl: string = '';
    private apiKey: string = '';
    private pollingInterval = 2000; // 2 seconds
    private token: string | null = null;
    private isInitialized = false;
    private tokenCache: string | null = null;
    private tokenExpiry: number | null = null;

    // Make constructor private
    private constructor() {
        super();
    }

    // Static method to get instance
    public static getInstance(): PipelineService {
        if (!PipelineService.instance) {
            PipelineService.instance = new PipelineService();
        }
        return PipelineService.instance;
    }

    // Separate initialization method
    public async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    // Initialize method to replace constructor logic
    public async initialize() {
        if (this.isInitialized) return;

        // Log environment configuration
        console.log('Environment configuration:', {
            NEO4J_API_URL: process.env.NEO4J_API_URL,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            hasApiKey: !!process.env.NEO4J_API_KEY
        });

        this.baseUrl = process.env.NEO4J_API_URL?.endsWith('/') 
            ? process.env.NEO4J_API_URL.slice(0, -1) 
            : process.env.NEO4J_API_URL || '';
        this.apiKey = process.env.NEO4J_API_KEY || '';

        if (!this.baseUrl) {
            throw new Error('NEO4J_API_URL is not configured');
        }

        await this.verifyConnection();
        this.isInitialized = true;
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
        if (this.tokenCache && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.tokenCache;
        }

        const isServer = typeof window === 'undefined';
        const baseUrl = isServer 
            ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            : '';
        
        const response = await fetch(`${baseUrl}/api/pipeline/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            this.tokenCache = null;
            this.tokenExpiry = null;
            throw new Error(`Failed to get auth token: ${await response.text()}`);
        }

        const data = await response.json();
        this.tokenCache = data.token;
        this.tokenExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
        return data.token;
    }

    // Find the startProcessing method and replace it entirely with:
    async startProcessing(accountId: string, force: boolean = false): Promise<ProcessingResponse> {
        try {
            const token = await this.getToken();
            const requestId = uuidv4();
            
            const response = await fetch(`${this.baseUrl}/api/v1/account`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                    'x-api-key': this.apiKey,
                    'Accept': 'application/json',
                    'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                    'mode': 'cors'
                },
                body: JSON.stringify({ 
                    accountId,
                    force,
                    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/pipeline/webhooks`
                })
            });

            if (!response.ok) {
                throw new Error(`Processing failed: ${await response.text()}`);
            }

            const data = await response.json();
            if (data.taskId) {
                this.startPolling(data.taskId, accountId);
            }
            return data;
        } catch (error) {
            console.error('Processing error:', error);
            throw error;
        }
    }

    // Then find the checkStatus method and replace it with:
    async checkStatus(taskId: string): Promise<StatusResponse> {
        try {
            const token = await this.getToken();
            const response = await fetch(`${this.baseUrl}/api/v1/status/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                status: data.status,
                data: {
                    accountId: data.data?.accountId || '',
                    progress: typeof data.data?.progress === 'number' ? data.data.progress : 0,
                    currentStep: data.data?.currentStep || 'Initializing',
                    error: data.error?.message || data.data?.error,
                    taskId
                }
            };
        } catch (error) {
            console.error('Status check error:', error);
            return {
                status: 'failed',
                data: {
                    accountId: '',
                    progress: 0,
                    currentStep: 'Error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    taskId
                }
            };
        }
    }

    private async startPolling(taskId: string, accountId: string) {
        const checkStatus = async () => {
            try {
                const status = await this.checkStatus(taskId);
                
                // Always emit progress if available
                if (status.data?.progress !== undefined) {
                    this.emit('progressUpdate', status.data.progress);
                }

                if (status.status === 'complete') {
                    try {
                        const [summaries, metadata] = await Promise.all([
                            this.getSummaries(accountId, await this.getToken()),
                            this.getMetadata(accountId)
                        ]);
                        
                        const queryResult: QueryResult = {
                            accountId,
                            timestamp: new Date().toISOString(),
                            status: 'complete',
                            financialSummary: {
                                totalUsdValue: metadata.wealth.totalUSDValue,
                                nearBalance: metadata.wealth.balance.items.find(i => i.symbol === 'NEAR')?.amount?.toString() || '0',
                                defiValue: metadata.wealth.defi.totalUSDValue
                            },
                            analysis: {
                                transactionCount: metadata.tx_count,
                                isBot: metadata.bot_detection.isPotentialBot,
                                robustSummary: summaries.robustSummary,
                                shortSummary: summaries.shortSummary
                            }
                        };
                        
                        this.emit('processingComplete', queryResult);
                        return true;
                    } catch (error) {
                        console.error('Error fetching final data:', error);
                        this.emit('progressUpdate', 0);
                        return true;
                    }
                }
                
                return false;
            } catch (error) {
                console.error('Polling error:', error);
                this.emit('progressUpdate', 0);
                return true;
            }
        };

        const poll = async () => {
            const shouldStop = await checkStatus();
            if (!shouldStop) {
                setTimeout(poll, this.pollingInterval);
            }
        };

        poll();
    }

    async getMetadata(accountId: string): Promise<MetadataResponse> {
        if (!this.token) {
            throw new Error('No token available for metadata fetch');
        }
        
        const response = await fetch(`/api/pipeline/metadata/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch metadata');
        }
        return response.json();
    }

    async getSummaries(accountId: string, token?: string): Promise<{
        robustSummary: string;
        shortSummary: string;
    }> {
        if (!token) {
            token = await this.getToken();
        }
        
        const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/pipeline/summary/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': process.env.NEO4J_API_KEY || '',
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch summaries');
        }
        return response.json();
    }

    // Type-safe event emitter methods
    on<K extends keyof PipelineServiceEvents>(
        event: K, 
        listener: PipelineServiceEvents[K]
    ): this {
        if (!event || !listener) {
            throw new Error('Invalid event or listener');
        }
        return super.on(event, listener);
    }

    emit<K extends keyof PipelineServiceEvents>(
        event: K,
        ...args: Parameters<PipelineServiceEvents[K]>
    ): boolean {
        if (!event) {
            throw new Error('Invalid event');
        }
        return super.emit(event, ...args);
    }

    private validateConfig() {
        const required = {
            'NEO4J_API_URL': process.env.NEO4J_API_URL,
            'NEO4J_API_KEY': process.env.NEO4J_API_KEY,
            'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
        };

        const missing = Object.entries(required)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    async executeQuery(query: string, accountId: string = 'trovelabs.near'): Promise<QueryResult> {
        const token = await this.getToken();
        const requestId = uuidv4();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
            const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                    'x-api-key': process.env.NEO4J_API_KEY || '',
                },
                body: JSON.stringify({ query, accountId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Query failed: ${await response.text()}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Query timed out. Please try a simpler query.');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private formatResponse(response: string) {
        try {
            const parsed = JSON.parse(response);
            return parsed;
        } catch (e) {
            if (response.includes('Query time')) {
                const jsonStart = response.indexOf('{');
                const jsonEnd = response.lastIndexOf('}') + 1;
                if (jsonStart >= 0 && jsonEnd > 0) {
                    const jsonPart = response.slice(jsonStart, jsonEnd);
                    return JSON.parse(jsonPart);
                }
            }
            console.warn('Response parsing failed:', e);
            return { raw: response };
        }
    }
}
