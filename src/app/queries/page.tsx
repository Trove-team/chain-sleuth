// components/query/QueryInput.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { utils } from 'near-api-js';

const QUERY_COST = '1'; // 1 NEAR

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { selector, accountId } = useWalletSelector();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearAddress.trim() || !accountId || !selector) return;

    setIsLoading(true);
    try {
      const wallet = await selector.wallet();
      const oneNear = utils.format.parseNearAmount(QUERY_COST);
      
      // Call the contract method
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: process.env.NEXT_PUBLIC_CONTRACT_ID || 'chainsleuth2.testnet',
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'request_investigation',
              args: {
                target_account: nearAddress,
              },
              gas: '300000000000000', // 300 TGas
              deposit: oneNear || '0',
            }
          }
        ]
      });

      router.push('/queries');
    } catch (error) {
      console.error('Query error:', error);
      alert('Failed to submit query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Query NEAR Address</h2>
      {!accountId ? (
        <div className="text-center py-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700 mb-2">Please connect your wallet to make queries</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="nearAddress" className="text-gray-700">
              Enter NEAR Address to Query ({QUERY_COST} NEAR required)
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
                disabled={isLoading || !nearAddress.trim()}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors
                  ${isLoading || !nearAddress.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                `}
              >
                {isLoading ? 'Submitting...' : 'Query'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}