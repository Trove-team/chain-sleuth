// src/types/nft.ts
import { Contract } from 'near-api-js';

// Contract Interface Types
export interface NFTContractMetadata {
  title: string;
  description: string;
  media: string;
  copies?: number;
  issued_at?: string;
  expires_at?: string;
  starts_at?: string;
  updated_at?: string;
  extra?: string;
  reference?: string;
  reference_hash?: string;
}

export interface NFTToken {
  token_id: string;
  owner_id: string;
  metadata: NFTContractMetadata;
}

export interface NFTContract extends Contract {
  nft_tokens(args: { from_index?: string; limit?: number }): Promise<NFTToken[]>;
  nft_token(args: { token_id: string }): Promise<NFTToken>;
  nft_total_supply(): Promise<string>;
  nft_tokens_for_owner(args: { 
    account_id: string;
    from_index?: string;
    limit?: number;
  }): Promise<NFTToken[]>;
}

// Application Types
export interface NFTMetadata {
  id: string;
  title: string;
  description: string;
  queried_name: string;
  querier: string;
  reputation_score: number;
  timestamp: string;
}

export interface QueryResponse {
  queries: NFTMetadata[];
  hasMore: boolean;
  nextPage?: number;
}