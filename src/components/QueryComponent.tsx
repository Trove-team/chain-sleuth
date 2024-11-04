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
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let retryCount = 0;
      const maxRetries = 5;
      let metadataData: MetadataResponse | null = null;

      while (retryCount < maxRetries) {
        const metadataResponse = await fetch(`/api/pipeline/metadata/${accountId}`);
        
        if (!metadataResponse.ok) {
          throw new Error(`Metadata fetch failed: ${metadataResponse.statusText}`);
        }
        
        const response = await metadataResponse.json();
        console.log(`Received metadata attempt ${retryCount + 1}:`, response);

        if (response.data?.metadata) {
          metadataData = response.data.metadata as MetadataResponse;
        } else if (response.data) {
          metadataData = response.data as MetadataResponse;
        }

        if (response.status === 'processing') {
          onProgressUpdate(Math.min((retryCount / maxRetries) * 100, 95));
        }

        if (metadataData?.robustSummary && metadataData?.shortSummary) {
          break;
        }

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
          totalUsdValue: metadataData.wealth?.totalUSDValue || 0,
          nearBalance: metadataData.wealth?.balance?.items
            ?.find((i: { symbol: string; amount: number | string }) => i.symbol === "NEAR")?.amount?.toString() || "0",
          defiValue: metadataData.wealth?.defi?.totalUSDValue || 0
        },
        analysis: {
          transactionCount: metadataData.tx_count || 0,
          isBot: metadataData.bot_detection?.isPotentialBot || false,
          robustSummary: metadataData.robustSummary || '',
          shortSummary: metadataData.shortSummary || ''
        }
      };

      onProcessingComplete(queryResult);
      toast.success('Processing completed');
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch results');
      throw error;
    } finally {
      setLoading(false);
      onProgressUpdate(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: nearAddress.trim() })
      });

      const data = await response.json();

      if (data.status === 'exists') {
        toast.info('Account already analyzed, fetching results...');
        await fetchResults(nearAddress.trim());
      } else if (!response.ok) {
        throw new Error('Failed to start pipeline');
      } else {
        toast.info('Starting new analysis...');
        await fetchResults(nearAddress.trim());
      }
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
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-400 text-gray-900 bg-white"
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