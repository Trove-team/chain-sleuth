// src/app/queries/page.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import QueryResults from '@/components/query/QueryResults';
import type { NFTMetadata, NFTToken, NFTExtraData } from '@/types/nft';

const ITEMS_PER_PAGE = 10;

const transformNFTToken = (token: NFTToken): NFTMetadata => {
  console.log('Raw token data:', token);
  
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
      const extraData = JSON.parse(token.metadata.extra);
      console.log('Parsed extra data:', extraData);

      // Access the nested parsed fields
      const parsedFields = extraData.parsed_data?.parsed_fields || {};
      
      parsedExtra = {
        ...parsedExtra,
        subject_account: extraData.investigated_account || 'Unknown',
        investigator: extraData.investigator || 'Unknown',
        creation_date: extraData.investigation_date || 'Unknown',
        transaction_count: Number(parsedFields.transaction_count?.replace(/,/g, '')) || 0,
        total_usd_value: Number(parsedFields.total_usd_value?.replace(/[^0-9.-]+/g, '')) || 0,
        defi_value: Number(parsedFields.defi_value?.replace(/[^0-9.-]+/g, '')) || 0,
        near_balance: Number(parsedFields.near_balance?.replace(/[^0-9.-]+/g, '')) || 0,
        eth_address: parsedFields.eth_address || 'Unknown'
      };

      console.log('Transformed data:', parsedExtra);
    }
  } catch (error) {
    console.error('Error parsing extra data:', error);
  }

  return {
    id: token.token_id,
    title: token.metadata.title || 'Untitled',
    description: token.metadata.description || 'No description available',
    timestamp: token.metadata.issued_at || 'Unknown',
    extra: parsedExtra
  };
};

export default function QueriesPage(): JSX.Element {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery({
    queryKey: ['nft-queries'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/near-contract/nft-tokens?page=${pageParam}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const tokens: NFTToken[] = await response.json();
      return tokens.map(transformNFTToken);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (!Array.isArray(lastPage) || lastPage.length === 0) return undefined;
      return lastPage.length === ITEMS_PER_PAGE ? pages.length : undefined;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const flattenedData = data?.pages.flat() || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Query Results</h1>
      
      <div className="space-y-6">
        {status === 'pending' ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : status === 'error' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>Error fetching queries: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {flattenedData.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No queries found</p>
              </div>
            ) : (
              <>
                <QueryResults queries={flattenedData} />
                
                {hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-opacity"
                    >
                      {isFetchingNextPage
                        ? 'Loading more...'
                        : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}

            {isFetchingNextPage && (
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}