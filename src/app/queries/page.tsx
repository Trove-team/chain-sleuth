// app/queries/page.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import QueryResults from '@/components/query/QueryResults';
import type { NFTMetadata, NFTToken, NFTExtraData } from '@/types/nft';

const ITEMS_PER_PAGE = 10;

const transformNFTToken = (token: NFTToken): NFTMetadata => {
  let parsedExtra: NFTExtraData = {
    subject_account: 'Unknown',
    investigator: 'Unknown',
    creation_date: 'Unknown',
    last_updated: 'Unknown',
    transaction_count: 0,
    total_usd_value: 0,
    defi_value: 0,
    near_balance: 0,
    reputation_score: null,
    eth_address: 'Unknown'
  };

  try {
    if (token.metadata.extra) {
      const extraData: Record<string, any> = JSON.parse(token.metadata.extra);
      parsedExtra = {
        ...parsedExtra,
        subject_account: extraData.subject_account || extraData.investigated_account || 'Unknown',
        investigator: extraData.investigator || 'Unknown',
        creation_date: extraData.creation_date || 'Unknown',
        last_updated: extraData.last_updated || 'Unknown',
        transaction_count: Number(extraData.transaction_count) || 0,
        total_usd_value: Number(extraData.total_usd_value) || 0,
        defi_value: Number(extraData.defi_value) || 0,
        near_balance: Number(extraData.near_balance) || 0,
        eth_address: extraData.eth_address || 'Unknown',
        reputation_score: extraData.reputation_score || null
      };
    }
  } catch (error) {
    console.error('Error parsing extra data:', error);
  }

  return {
    id: token.token_id,
    title: token.metadata.title || 'Untitled',
    description: token.metadata.description || 'No description available',
    timestamp: token.metadata.issued_at || 'Unknown',
    extra: {
      subject_account: parsedExtra.subject_account,
      investigator: parsedExtra.investigator,
      creation_date: parsedExtra.creation_date,
      last_updated: parsedExtra.last_updated,
      transaction_count: parsedExtra.transaction_count,
      total_usd_value: parsedExtra.total_usd_value,
      defi_value: parsedExtra.defi_value,
      near_balance: parsedExtra.near_balance,
      reputation_score: parsedExtra.reputation_score,
      eth_address: parsedExtra.eth_address
    }
  };
};