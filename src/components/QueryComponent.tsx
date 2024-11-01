'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { ProcessingResponse, StatusResponse, QueryResult } from '@/types/pipeline';

interface QueryComponentProps {
  onProgressUpdate: (progress: number) => void;
  onProcessingComplete: (result: QueryResult) => void;
}

export default function QueryComponent({ onProgressUpdate, onProcessingComplete }: QueryComponentProps) {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResponse | null>(null);

  const fetchResults = async (accountId: string) => {
    try {
      const metadataResponse = await fetch(`/api/pipeline/metadata/${accountId}`);
      if (!metadataResponse.ok) {
        throw new Error(`Metadata fetch failed: ${metadataResponse.statusText}`);
      }
      
      const metadataData = await metadataResponse.json();
      console.log('Received metadata:', metadataData);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: nearAddress.trim(),
          force: false 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      const data = await response.json();
      
      if (data.taskId) {
        const eventSource = new EventSource(`/api/pipeline/events/${data.taskId}`);
        
        eventSource.onmessage = async (event) => {
          try {
            const status: StatusResponse = JSON.parse(event.data);
            console.log('Status update:', status);
            
            if (status.data?.progress !== undefined) {
              onProgressUpdate(status.data.progress);
            }
            
            if (status.status === 'complete') {
              eventSource.close();
              await fetchResults(nearAddress.trim());
            } else if (status.status === 'failed') {
              eventSource.close();
              toast.error(status.data?.error || 'Processing failed');
            }
          } catch (error) {
            console.error('Error processing status:', error);
            eventSource.close();
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          eventSource.close();
          toast.error('Lost connection to server');
        };
      }

      setResult(data);
    } catch (error) {
      console.error('Error starting processing:', error);
      toast.error('Failed to start processing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={nearAddress}
          onChange={(e) => setNearAddress(e.target.value)}
          placeholder="Enter NEAR address"
          className="w-full p-3 border rounded-lg"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !nearAddress.trim()}
          className="w-full p-3 bg-black text-white rounded-lg disabled:bg-gray-300"
        >
          {loading ? 'Processing...' : 'Start Processing'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.status === 'error' ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <p className={`text-sm ${
            result.status === 'error' ? 'text-red-600' : 'text-green-600'
          }`}>
            {result.message}
          </p>
          {result.taskId && result.status !== 'error' && (
            <p className="text-sm text-gray-500 mt-2">
              Task ID: {result.taskId}
            </p>
          )}
        </div>
      )}
    </div>
  );
}