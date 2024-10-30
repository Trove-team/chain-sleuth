/**
 * Webhook types that match the smart contract's WebhookType enum
 * @see contract/src/webhook_mappings.rs
 */
export type WebhookType = 'Progress' | 'Completion' | 'Error' | 'MetadataReady' | 'Log';

export interface WebhookData {
    type: WebhookType;
    data: {
        taskId: string;
        requestId: string;
        accountId: string;
        timestamp: string;
        progress?: number;
        message?: string;
        result?: {
            robustSummary?: string;
            shortSummary?: string;
            financialData?: {
                totalUsdValue: string;
                nearBalance: string;
                defiValue: string;
            };
            transactionCount?: number;
            isBot?: boolean;
        };
        error?: string;
    };
}