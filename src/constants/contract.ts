// src/constants/contract.ts
import { Account, Contract } from "near-api-js";
import { AccountMetadata, InvestigationSummaries, InvestigationNFTMetadata } from "../types/investigation";
import { WebhookType } from '../types/webhook';

// Add NFT types
export interface NFTContractMetadata {
    spec: string;           // required, essentially a version like "nft-1.0.0"
    name: string;           // required, ex. "Chain Sleuth"
    symbol: string;         // required, ex. "CSI"
    icon?: string;         // optional, data URL
    base_uri?: string;     // optional, Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    reference?: string;    // optional, URL to a JSON file with more info
    reference_hash?: string; // optional, base64-encoded sha256 hash of JSON from reference field
}

export interface Token {
    token_id: string;
    owner_id: string;
    metadata?: {
        title?: string;
        description?: string;
        media?: string;
        media_hash?: string;
        copies?: number;
        issued_at?: string;
        expires_at?: string;
        starts_at?: string;
        updated_at?: string;
        extra?: string;
        reference?: string;
        reference_hash?: string;
    };
    approved_account_ids?: Record<string, number>;
}

const getContractId = () => {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  console.log('[CONTRACT] Loading contract ID from env:', contractId);
  
  if (!contractId) {
    console.warn('[CONTRACT] No contract ID found in env, using default');
    return 'chainsleuth-testing.near';
  }
  
  return contractId;
};

// Constants
export const CONTRACT_ID = getContractId();
export const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID || 'mainnet';
export const DEFAULT_GAS = '300000000000000'; // 300 TGas
export const DEFAULT_DEPOSIT = '1000000000000000000000000'; // 1 NEAR
export const DEFAULT_NFT_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_NFT_IMAGE_URL || 
  'https://gateway.pinata.cloud/ipfs/QmSNycrd5gWH7QAFKBVvKaT58c5S6B1tq9ScHP7thxvLWM';

// Contract methods
export const CONTRACT_METHODS = {
    START_INVESTIGATION: 'start_investigation',
    UPDATE_INVESTIGATION_METADATA: 'update_investigation_metadata',
    RETRY_INVESTIGATION: 'retry_investigation',
    NFT_TRANSFER: 'nft_transfer',
    NFT_TRANSFER_CALL: 'nft_transfer_call',
    GET_INVESTIGATION_STATUS: 'get_investigation_status',
    GET_INVESTIGATION_BY_ACCOUNT: 'get_investigation_by_account',
    NFT_METADATA: 'nft_metadata',
    NFT_TOKEN: 'nft_token'
} as const;

// Contract interface
export interface InvestigationContract extends Contract {
    start_investigation(args: {
        args: {
            target_account: string;
        };
        gas: string;
        deposit?: string;
    }): Promise<{ request_id: string; status: string; message?: string }>;

    update_investigation_metadata(args: {
        args: {
            token_id: string;
            metadata_update: {
                description?: string;
                extra: string;
            };
            webhook_type: WebhookType;
        };
        gas: string;
    }): Promise<boolean>;

    get_investigation_status(args: { token_id: string }): Promise<string>;
    get_investigation_by_account(args: { account_id: string }): Promise<Token>;
    nft_metadata(): Promise<NFTContractMetadata>;
    nft_token(args: { token_id: string }): Promise<Token>;
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
                CONTRACT_METHODS.GET_INVESTIGATION_STATUS,
                CONTRACT_METHODS.GET_INVESTIGATION_BY_ACCOUNT,
                CONTRACT_METHODS.NFT_METADATA,
                CONTRACT_METHODS.NFT_TOKEN
            ],
            changeMethods: [
                CONTRACT_METHODS.START_INVESTIGATION,
                CONTRACT_METHODS.UPDATE_INVESTIGATION_METADATA,
                CONTRACT_METHODS.RETRY_INVESTIGATION,
                CONTRACT_METHODS.NFT_TRANSFER,
                CONTRACT_METHODS.NFT_TRANSFER_CALL
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
