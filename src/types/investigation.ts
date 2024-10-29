// Import WebhookType from webhook.ts
import { WebhookType } from './webhook';

// Define valid status types
export type InvestigationStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

// Define timestamp type to match contract's U64
export type NearTimestamp = string | number;

// Core investigation data (stored in 'extra' field of NFT)
export interface InvestigationMetadata {
    case_number: number;
    target_account: string;
    requester: string;
    investigation_date: NearTimestamp;
    last_updated: NearTimestamp;
    status: InvestigationStatus;
    financial_summary: {
        total_usd_value: string;
        near_balance: string;
        defi_value: string;
    };
    analysis_summary: {
        robust_summary: string | null;
        short_summary: string | null;
        transaction_count: number;
        is_bot: boolean;
    };
}

// Account metadata from external sources
export interface AccountMetadata {
    // Core account info
    accountId: string;
    created: string;
    last_updated: string;
    tx_count: number;

    // Financial data
    wealth: {
        defi: {
            totalUSDValue: string;
        };
        balance: {
            items: {
                contract: string;
                amount: number;
                symbol: string;
                usdValue: string;
                tokenPrice?: string;
            }[];
            totalUSDValue: string;
        };
        totalUSDValue: string;
    };

    // Analysis data
    bot_detection: {
        isPotentialBot: boolean;
    };
    
    // Status tracking
    status: 'completed' | 'processing' | 'failed';
    taskId: string;
}

// Investigation summaries interface
export interface InvestigationSummaries {
    robustSummary: string | null;
    shortSummary: string | null;
}

// The actual NFT metadata structure
export interface InvestigationNFTMetadata {
    title: string;          // Displayed as NFT title
    description: string;    // Displayed as NFT description
    media: string;         // NFT image URL
    media_hash?: string | null;
    copies?: number;
    issued_at: string;
    extra: InvestigationMetadata;
}

// Webhook data structure (moved from webhook.ts if you want to consolidate)
export interface WebhookData {
    type: WebhookType;
    status: 'processing' | 'complete' | 'failed';
    data: {
        accountId: string;
        taskId: string;
        requestId: string;
        progress?: number;
        message?: string;
        result?: {
            robustSummary: string;
            shortSummary: string;
            transactionCount: number;
            isBot: boolean;
            financialData: {
                totalUsdValue: string;
                nearBalance: string;
                defiValue: string;
            }
        };
        error?: string;
        timestamp: string;
    };
}

// Updated helper function to ensure consistent metadata structure
export function formatInvestigationMetadata(
    accountMetadata: AccountMetadata,
    summaries: InvestigationSummaries,
    caseNumber: number = 0,  // You'll need to pass this from the contract
    requester: string = ''   // You'll need to pass this from the contract
): InvestigationNFTMetadata {
    return {
        title: `Case File #${caseNumber}: ${accountMetadata.accountId}`,
        description: summaries.robustSummary || "Investigation in progress...",
        media: process.env.NEXT_PUBLIC_DEFAULT_NFT_IMAGE_URL!,
        media_hash: null,
        copies: 1,
        issued_at: new Date().toISOString(),
        extra: {
            case_number: caseNumber,
            target_account: accountMetadata.accountId,
            requester: requester,
            investigation_date: accountMetadata.created,
            last_updated: accountMetadata.last_updated,
            status: accountMetadata.status === 'completed' ? 'Completed' 
                 : accountMetadata.status === 'processing' ? 'Processing'
                 : accountMetadata.status === 'failed' ? 'Failed'
                 : 'Pending',
            financial_summary: {
                total_usd_value: accountMetadata.wealth.totalUSDValue,
                near_balance: accountMetadata.wealth.balance.items
                    .find(item => item.symbol === "NEAR")?.amount.toString() || "0",
                defi_value: accountMetadata.wealth.defi.totalUSDValue
            },
            analysis_summary: {
                robust_summary: summaries.robustSummary,
                short_summary: summaries.shortSummary,
                transaction_count: accountMetadata.tx_count,
                is_bot: accountMetadata.bot_detection.isPotentialBot
            }
        }
    };
}