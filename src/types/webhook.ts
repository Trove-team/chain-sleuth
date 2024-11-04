import { MetadataResponse } from "./pipeline";

/**
 * Webhook types that match the smart contract's WebhookType enum
 * @see contract/src/webhook_mappings.rs
 */
export type WebhookType = 'Progress' | 'Completion' | 'Error' | 'MetadataReady' | 'Log';

export interface WebhookData {
    taskId: string;
    status: 'processing' | 'complete' | 'failed';
    type: WebhookType;
    data: {
        progress?: number;
        message?: string;
        error?: string;
        accountId: string;
        metadata?: MetadataResponse;
        currentStep?: string;
    };
    lastUpdated?: string;
    webhookId?: string;
}