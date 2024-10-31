'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import QueryResults from './query/QueryResults';
import type { ProcessingResponse, StatusResponse, QueryResult } from '@/types/pipeline';

export default function QueryComponent() {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResponse | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);

  const startStatusPolling = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pipeline?taskId=${taskId}`);
        const status: StatusResponse = await response.json();
        
        if (status.data?.progress !== undefined) {
          setProgress(status.data.progress);
        }

        if (status.status === 'complete') {
          clearInterval(pollInterval);
          const metadataResponse = await fetch(`/api/pipeline/metadata/${nearAddress}`);
          const metadataData = await metadataResponse.json();
          
          const queryResult: QueryResult = {
            accountId: nearAddress,
            timestamp: new Date().toISOString(),
            status: 'Completed',
            financialSummary: {
              totalUsdValue: metadataData.wealth.totalUSDValue,
              nearBalance: metadataData.wealth.balance.items
                .find((i: any) => i.symbol === "NEAR")?.amount.toString() || "0",
              defiValue: metadataData.wealth.defi.totalUSDValue
            },
            analysis: {
              transactionCount: metadataData.tx_count,
              isBot: metadataData.bot_detection.isPotentialBot,
              robustSummary: metadataData.robustSummary,
              shortSummary: metadataData.shortSummary
            }
          };

          setQueryResults(prev => [queryResult, ...prev]);
          toast.success('Processing completed');
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          toast.error(status.data?.error || 'Processing failed');
        }
      } catch (error) {
        console.error('Status polling failed:', error);
        clearInterval(pollInterval);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setProgress(0);

    try {
      const initResponse = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: nearAddress.trim() })
      });

      if (!initResponse.ok) {
        throw new Error('Failed to start processing');
      }

      const data = await initResponse.json();
      
      if (data.status === 'exists') {
        console.log('Account exists, forcing reprocessing...');
        const reprocessResponse = await fetch('/api/pipeline/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accountId: nearAddress.trim(),
            force: true 
          })
        });
        
        if (!reprocessResponse.ok) {
          throw new Error('Reprocessing failed');
        }
        
        const reprocessData = await reprocessResponse.json();
        setResult(reprocessData);
        
        if (reprocessData.taskId) {
          startStatusPolling(reprocessData.taskId);
          toast.success(`Reprocessing started - Task ID: ${reprocessData.taskId}`);
        }
      } else {
        setResult(data);
        if (data.taskId) {
          startStatusPolling(data.taskId);
          toast.success(`Processing started - Task ID: ${data.taskId}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        taskId: 'error',
        status: 'failed',
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process account'
        }
      });
      toast.error(error instanceof Error ? error.message : 'Failed to process account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={nearAddress}
          onChange={(e) => setNearAddress(e.target.value)}
          placeholder="Enter NEAR address"
          className="w-full p-2 border rounded"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !nearAddress.trim()}
          className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? 'Processing...' : 'Process Account'}
        </button>
      </form>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Results Display */}
      {queryResults.length > 0 && (
        <QueryResults queries={queryResults} />
      )}

      {/* Existing Data Display */}
      {result?.existingData && !queryResults.length && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Existing Results:</h3>
          <p>{result.existingData.shortSummary}</p>
          <details>
            <summary>Detailed Analysis</summary>
            <p>{result.existingData.robustSummary}</p>
          </details>
        </div>
      )}
    </div>
  );
}