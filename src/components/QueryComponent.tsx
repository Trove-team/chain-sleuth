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
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (accountId: string) => {
    try {
      // Add delay before fetching metadata to allow server processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let retryCount = 0;
      const maxRetries = 5;
      let metadataData = null;

      while (retryCount < maxRetries) {
        const metadataResponse = await fetch(`/api/pipeline/metadata/${accountId}`);
        
        if (!metadataResponse.ok) {
          throw new Error(`Metadata fetch failed: ${metadataResponse.statusText}`);
        }
        
        metadataData = await metadataResponse.json();
        console.log('Received metadata attempt ${retryCount + 1}:', metadataData);

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
      toast.error('Failed to fetch results - retrying...');
      // Retry the entire fetch after a delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      return fetchResults(accountId);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
        throw new Error(`Failed to start processing: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.taskId) {
        // Start polling with exponential backoff
        let retryCount = 0;
        const maxRetries = 10;
        const baseDelay = 5000; // 5 seconds

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
              setError(status.data?.error || 'Processing failed');
              toast.error('Processing failed - please try again');
            }
          } catch (error) {
            console.error('Error processing status:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              eventSource.close();
              setError('Failed to process status after multiple retries');
              toast.error('Connection lost - please try again');
            }
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          eventSource.close();
          setError('Lost connection to server');
          toast.error('Connection lost - please try again');
        };
      }

      setResult(data);
    } catch (error) {
      console.error('Error starting processing:', error);
      setError(error instanceof Error ? error.message : 'Failed to start processing');
      toast.error('Failed to start processing - please try again');
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