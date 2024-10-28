// src/types/nft.ts

import { Contract } from 'near-api-js';

// Existing interfaces remain the same
export interface NFTToken {
  token_id: string;
  metadata: {
    title: string;
    description: string;
    issued_at?: string;
    extra?: string;
  }
}

export interface ParsedFields {
  transaction_count: string;
  near_balance: string;
  eth_address: string;
}

export interface NFTExtraData {
  subject_account: string;
  investigator: string;
  creation_date: string;
  last_updated: string;
  transaction_count: number;
  total_usd_value: number;
  defi_value: number;
  near_balance: number;
  reputation_score: number | null;
  eth_address: string;
  investigation_date?: string;
  investigated_account?: string;
  parsed_data?: {
    parsed_fields: ParsedFields;
  };
}

export interface NFTMetadata {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  extra: {
    subject_account: string;
    investigator: string;
    creation_date: string;
    last_updated: string;
    transaction_count: number;
    total_usd_value: number;
    defi_value: number;
    near_balance: number;
    reputation_score: number | null;
    eth_address: string;
  }
}

// New contract interfaces
export interface NFTContractMethods {
  nft_tokens: (args: {
    from_index?: string;
    limit?: number;
  }) => Promise<NFTToken[]>;
  nft_total_supply: () => Promise<string>;
  nft_tokens_for_owner: (args: {
    account_id: string;
    from_index?: string;
    limit?: number;
  }) => Promise<NFTToken[]>;
  nft_token: (args: { token_id: string }) => Promise<NFTToken>;
}

export interface NFTContract extends Contract, NFTContractMethods {}

// Existing utility function
export const formatDate = (timestamp: string): string => {
  if (timestamp === 'Unknown') return 'N/A';
  try {
    const date = new Date(parseInt(timestamp) / 1_000_000);
    return date.toLocaleString();
  } catch {
    return 'N/A';
  }
};