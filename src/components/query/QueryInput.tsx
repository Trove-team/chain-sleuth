// components/query/QueryInput.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NFTMetadata } from '@/types/nft';

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearAddress.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/near-contract/mint-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: `query-${Date.now()}`,
          queried_name: nearAddress,
          querier: 'user',
          summary: 'Initial query'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create query');
      }

      router.push('/queries');
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="flex flex-col space-y-2">
        <label htmlFor="nearAddress" className="text-lg font-medium">
          Enter NEAR Address
        </label>
        <div className="flex space-x-2">
          <input
            id="nearAddress"
            type="text"
            value={nearAddress}
            onChange={(e) => setNearAddress(e.target.value)}
            placeholder="e.g. example.near"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
            `}
          >
            {isLoading ? 'Querying...' : 'Query'}
          </button>
        </div>
      </div>
    </form>
  );
}