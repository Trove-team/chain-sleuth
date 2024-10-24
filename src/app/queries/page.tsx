// app/queries/page.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import QueryResults from '@/components/query/QueryResults';
import type { NFTMetadata, QueryResponse } from '@/types/nft';

const ITEMS_PER_PAGE = 10;

export default function QueriesPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error
  } = useInfiniteQuery<NFTMetadata[]>({
    queryKey: ['nft-queries'],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/near-contract/nft-tokens?page=${pageParam}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
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