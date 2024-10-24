// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import Link from 'next/link';

export default function Home() {
  const [nearAddress, setNearAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { accountId } = useWalletSelector();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearAddress.trim() || !accountId) return;

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
          querier: accountId,
          summary: `Query for ${nearAddress}`
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Chain Sleuth Agent</h1>

      {/* Query Input Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Query NEAR Address</h2>
        {!accountId ? (
          <div className="text-center py-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 mb-2">Please connect your wallet to make queries</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="nearAddress" className="text-gray-700">
                Enter NEAR Address to Query
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
        )}
      </div>

      {/* Links Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">Resources</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/queries" className="text-blue-600 hover:underline">
              View All Queries
            </Link>
          </li>
          <li>
            <Link href="https://docs.mintbase.xyz/ai/mintbase-plugins" className="text-blue-600 hover:underline">
              Documentation
            </Link>
          </li>
          <li>
            <Link href="/.well-known/ai-plugin.json" className="text-blue-600 hover:underline">
              OpenAPI Spec
            </Link>
          </li>
          <li>
            <Link href="/api/swagger" className="text-blue-600 hover:underline">
              Swagger
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}