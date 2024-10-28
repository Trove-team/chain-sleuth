// src/constants/contract.ts
import { Account, Contract } from "near-api-js";
import { AccountMetadata, InvestigationSummaries, InvestigationNFTMetadata } from "../types/investigation";

const getContractId = () => {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  console.log('[CONTRACT] Loading contract ID from env:', contractId);
  
  if (!contractId) {
    console.warn('[CONTRACT] No contract ID found in env, using default');
    return 'chainsleuth2.testnet';
  }
  
  return contractId;
};

// Constants
export const CONTRACT_ID = getContractId();
export const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID || 'testnet';
export const DEFAULT_GAS = '300000000000000'; // 300 TGas
export const DEFAULT_DEPOSIT = '1000000000000000000000000'; // 1 NEAR
export const DEFAULT_NFT_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_NFT_IMAGE_URL || 
  'https://gateway.pinata.cloud/ipfs/QmSNycrd5gWH7QAFKBVvKaT58c5S6B1tq9ScHP7thxvLWM';

// Contract methods
export const CONTRACT_METHODS = {
    START_INVESTIGATION: 'start_investigation',
    UPDATE_INVESTIGATION_METADATA: 'update_investigation_metadata',
    NFT_TOKEN: 'nft_token',
    NFT_TOKENS_FOR_OWNER: 'nft_tokens_for_owner',
    NFT_TOTAL_SUPPLY: 'nft_total_supply'
} as const;

// Contract interface
export interface InvestigationContract extends Contract {
    start_investigation(args: {
        args: {
            target_account: string;
            initial_metadata?: Partial<InvestigationNFTMetadata>;
        };
        gas: string;
        deposit?: string;
    }): Promise<{ taskId: string }>;

    update_investigation_metadata(args: {
        args: {
            task_id: string;
            metadata_update: {
                description?: string;
                extra: string; // Stringified InvestigationNFTMetadata
            };
        };
        gas: string;
    }): Promise<void>;
}

// Contract initialization helper
export function initInvestigationContract(
    account: Account,
    contractId: string = CONTRACT_ID
): InvestigationContract {
    return new Contract(
        account,
        contractId,
        {
            viewMethods: [
                CONTRACT_METHODS.NFT_TOKEN,
                CONTRACT_METHODS.NFT_TOKENS_FOR_OWNER,
                CONTRACT_METHODS.NFT_TOTAL_SUPPLY
            ],
            changeMethods: [
                CONTRACT_METHODS.START_INVESTIGATION,
                CONTRACT_METHODS.UPDATE_INVESTIGATION_METADATA
            ],
            useLocalViewExecution: false
        }
    ) as InvestigationContract;
}

// Metadata formatting helper
export function formatNFTMetadata(
    accountMetadata: AccountMetadata,
    summaries: InvestigationSummaries
): InvestigationNFTMetadata {
    return {
        title: `Investigation: ${accountMetadata.accountId}`,
        description: summaries.robustSummary || "Investigation in progress...",
        media: DEFAULT_NFT_IMAGE,
        media_hash: null,
        copies: 1,
        issued_at: new Date().toISOString(),
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

// Helper for initial metadata
export function createInitialMetadata(accountId: string): Partial<InvestigationNFTMetadata> {
    return {
        title: `Investigation: ${accountId}`,
        description: "Investigation in progress...",
        media: DEFAULT_NFT_IMAGE,
        media_hash: null,
        copies: 1,
        issued_at: new Date().toISOString(),
        extra: {
            accountId,
            created: new Date().toISOString(), // Add created property
            last_updated: new Date().toISOString(), // Add last_updated property
            transaction_count: 0, // Add transaction_count property
            financial_summary: { // Add financial_summary object
                total_usd_value: "0",
                near_balance: "0",
                defi_value: "0"
            },
            bot_analysis: { // Add bot_analysis object
                is_bot: false
            },
            investigation_details: {
                task_id: '',  // Will be populated after contract call
                completion_date: ''
            }
            // view_url can be added if needed
        }
    };
}

// For debugging
console.log('[CONTRACT] Exported CONTRACT_ID:', CONTRACT_ID);
console.log('[CONTRACT] Exported NETWORK_ID:', NETWORK_ID);

// Placeholder for contract constants
export const DEFAULT_METHOD_NAMES = Object.values(CONTRACT_METHODS);
