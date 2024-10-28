// src/types/investigation.ts

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

export interface InvestigationSummaries {
    robustSummary: string | null;
    shortSummary: string | null;
}

// Updated NFT metadata structure
export interface InvestigationNFTMetadata {
    title: string;
    description: string; // Contains robust summary
    media: string;      // Will always be DEFAULT_NFT_IMAGE_URL
    media_hash?: null;  
    copies?: number;    // Will be 1
    issued_at: string;
    extra: {
        accountId: string;
        created: string;
        last_updated: string;
        transaction_count: number;
        financial_summary: {
            total_usd_value: string;
            near_balance: string;
            defi_value: string;
        };
        bot_analysis: {
            is_bot: boolean;
        };
        investigation_details: {
            task_id: string;
            completion_date: string;
        };
        view_url?: string; // We can add this later when queries page is ready
    };
}

// Helper function to ensure consistent metadata structure
export function formatInvestigationMetadata(
    accountMetadata: AccountMetadata,
    summaries: InvestigationSummaries
): InvestigationNFTMetadata {
    return {
        title: `Investigation: ${accountMetadata.accountId}`,
        description: summaries.robustSummary || "Investigation in progress...",
        media: process.env.NEXT_PUBLIC_DEFAULT_NFT_IMAGE_URL!, // From contract DEFAULT_NFT_IMAGE_URL
        issued_at: new Date().toISOString(),
        copies: 1,
        extra: {
            accountId: accountMetadata.accountId,
            created: accountMetadata.created,
            last_updated: accountMetadata.last_updated,
            transaction_count: accountMetadata.tx_count,
            financial_summary: {
                total_usd_value: accountMetadata.wealth.totalUSDValue,
                near_balance: accountMetadata.wealth.balance.items
                    .find(item => item.symbol === "NEAR")?.amount.toString() || "0",
                defi_value: accountMetadata.wealth.defi.totalUSDValue
            },
            bot_analysis: {
                is_bot: accountMetadata.bot_detection.isPotentialBot
            },
            investigation_details: {
                task_id: accountMetadata.taskId,
                completion_date: accountMetadata.last_updated
            }
        }
    };
}
