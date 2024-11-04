// Path: src/types/index.ts

export type PipelineStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'exists';
export type WebhookStatus = 'pending' | 'retrying' | 'delivered' | 'failed';

export interface StatusUpdate {
    status?: PipelineStatus;
    progress?: number;
    currentStep?: string;
    error?: string;
    metadata?: MetadataResponse;
}

export interface WebhookJobData {
    webhookId?: string;
    taskId: string;
    type: string;
    status: PipelineStatus;
    data: {
        accountId: string;
        metadata?: MetadataResponse;
        progress?: number;
        error?: string;
        message?: string;
    };
}

// Move existing interfaces from pipeline.ts
export interface QueryResult {
    accountId: string;
    timestamp: string;
    status: string;
    financialSummary: {
        totalUsdValue: number;
        nearBalance: string;
        defiValue: number;
    };
    analysis: {
        transactionCount: number;
        isBot: boolean;
        robustSummary: string;
        shortSummary: string;
    };
}

export interface StatusResponse {
    status: PipelineStatus;
    data: {
        accountId: string;
        progress?: number;
        currentStep?: string;
        error?: string;
        taskId: string;
        metadata?: MetadataResponse;
    };
}

export interface MetadataResponse {
    wealth: {
        totalUSDValue: number;
        balance: {
            items: Array<{
                symbol: string;
                amount: number | string;
            }>;
        };
        defi: {
            totalUSDValue: number;
        };
    };
    tx_count: number;
    bot_detection: {
        isPotentialBot: boolean;
    };
    robustSummary?: string;
    shortSummary?: string;
}

export interface StatusUpdate {
    progress?: number;
    currentStep?: string;
    error?: string;
    metadata?: MetadataResponse;
    status?: PipelineStatus;
}

export interface ProcessingResponse {
    taskId: string;
    status: PipelineStatus;
    statusLink?: string;
    data?: {
        progress?: number;
        metadata?: MetadataResponse;
        error?: {
            code: string;
            message: string;
        };
    };
}