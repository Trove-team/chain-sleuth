// src/app/queries/page.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import QueryResults from '@/components/query/QueryResults';
import { InvestigationNFTMetadata, InvestigationStatus, NearTimestamp } from '@/types/investigation';

const ITEMS_PER_PAGE = 10;

const convertNearTimestamp = (timestamp: NearTimestamp): string => {
  if (typeof timestamp === 'string') {
    // If already a string, ensure it's a valid date or return current date
    return new Date(timestamp).toISOString();
  }
  // Convert NEAR U64 nanoseconds to milliseconds
  return new Date(Number(timestamp) / 1_000_000).toISOString();
};

const transformNFTToken = (token: any): InvestigationNFTMetadata => {
  console.log('Raw token data:', token);
  
  try {
    if (token.metadata.extra) {
      const extraData = JSON.parse(token.metadata.extra);
      console.log('Parsed extra data:', extraData);
      
      return {
        title: token.metadata.title || 'Untitled',
        description: token.metadata.description || 'No description available',
        media: token.metadata.media || '',
        media_hash: token.metadata.media_hash,
        copies: token.metadata.copies,
        issued_at: convertNearTimestamp(token.metadata.issued_at || Date.now()),
        extra: {
          ...extraData,
          investigation_date: convertNearTimestamp(extraData.investigation_date),
          last_updated: convertNearTimestamp(extraData.last_updated),
          status: extraData.status as InvestigationStatus
        }
      };
    }
    throw new Error('No extra metadata found');
  } catch (error) {
    const now = Date.now().toString();
    console.error('Error parsing extra data:', error);
    
    return {
      title: token.metadata.title || 'Untitled',
      description: token.metadata.description || 'No description available',
      media: token.metadata.media || '',
      media_hash: null,
      copies: 1,
      issued_at: convertNearTimestamp(now),
      extra: {
        case_number: 0,
        target_account: 'Unknown',
        requester: 'Unknown',
        investigation_date: now,
        last_updated: now,
        status: 'Failed' as InvestigationStatus,
        financial_summary: {
          total_usd_value: '0',
          near_balance: '0',
          defi_value: '0'
        },
        analysis_summary: {
          robust_summary: null,
          short_summary: null,
          transaction_count: 0,
          is_bot: false
        }
      }
    };
  }
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
      const tokens = await response.json();
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
                      {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}