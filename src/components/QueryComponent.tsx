'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { QueryResult, MetadataResponse, ProcessingResponse } from '@/types/pipeline';

interface QueryComponentProps {
  onProgressUpdate: (progress: number) => void;
  onProcessingComplete: (result: QueryResult) => void;
}

export default function QueryComponent({ onProgressUpdate, onProcessingComplete }: QueryComponentProps) {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (accountId: string): Promise<void> => {
    try {
      // Add delay before fetching metadata to allow server processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let retryCount = 0;
      const maxRetries = 5;
      let metadataData: MetadataResponse | null = null;

      while (retryCount < maxRetries) {
        const metadataResponse = await fetch(`/api/pipeline/metadata/${accountId}`);
        
        if (!metadataResponse.ok) {
          throw new Error(`Metadata fetch failed: ${metadataResponse.statusText}`);
        }
        
        metadataData = await metadataResponse.json() as MetadataResponse;
        console.log(`Received metadata attempt ${retryCount + 1}:`, metadataData);

        // Check if we have the required data
        if (metadataData?.robustSummary && metadataData?.shortSummary) {
          break;
        }

        // If not complete, wait and retry
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (!metadataData) {
        throw new Error('Failed to fetch metadata after multiple retries');
      }

      const queryResult: QueryResult = {
        accountId,
        timestamp: new Date().toISOString(),
        status: 'Completed',
        financialSummary: {
          totalUsdValue: metadataData.wealth.totalUSDValue,
          nearBalance: metadataData.wealth.balance.items
            .find((i: { symbol: string; amount: number | string }) => i.symbol === "NEAR")?.amount.toString() || "0",
          defiValue: metadataData.wealth.defi.totalUSDValue
        },
        analysis: {
          transactionCount: metadataData.tx_count,
          isBot: metadataData.bot_detection.isPotentialBot,
          robustSummary: metadataData.robustSummary,
          shortSummary: metadataData.shortSummary
        }
      };

      onProcessingComplete(queryResult);
      toast.success('Processing completed');
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch results');
      throw error; // Re-throw to be handled by caller
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetchResults(nearAddress.trim());
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={nearAddress}
          onChange={(e) => setNearAddress(e.target.value)}
          placeholder="Enter NEAR address"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>
      
      <button
        type="submit"
        disabled={loading || !nearAddress.trim()}
        className={`w-full px-4 py-2 text-white rounded-lg ${
          loading || !nearAddress.trim() 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : 'Process Account'}
      </button>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
    </form>
  );
}