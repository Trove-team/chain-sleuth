// src/types/nft.ts
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