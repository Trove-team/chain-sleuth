'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { StatusResponse, MetadataResponse, QueryResult } from '@/types';

interface QueryComponentProps {
  onProgressUpdate: (progress: number) => void;
  onProcessingComplete: (result: QueryResult) => void;
}

export default function QueryComponent({ onProgressUpdate, onProcessingComplete }: QueryComponentProps) {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleWebhookResponse = async (metadata: MetadataResponse) => {
    const queryResult: QueryResult = {
      accountId: nearAddress.trim(),
      timestamp: new Date().toISOString(),
      status: 'complete',
      financialSummary: {
        totalUsdValue: metadata.wealth.totalUSDValue,
        nearBalance: metadata.wealth.balance.items
          .find(i => i.symbol === "NEAR")?.amount?.toString() || "0",
        defiValue: metadata.wealth.defi.totalUSDValue
      },
      analysis: {
        transactionCount: metadata.tx_count,
        isBot: metadata.bot_detection.isPotentialBot,
        robustSummary: metadata.robustSummary || '',
        shortSummary: metadata.shortSummary || ''
      }
    };

    onProcessingComplete(queryResult);
    toast.success('Processing completed');
  };

  const startStatusPolling = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pipeline/status?taskId=${taskId}`);
        const data: StatusResponse = await response.json();
        
        setStatus(data);
        
        if (data.data?.progress) {
          onProgressUpdate(data.data.progress);
        }
        
        if (data.status === 'complete' && data.data?.metadata) {
          clearInterval(pollInterval);
          handleWebhookResponse(data.data.metadata);
          setLoading(false);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          setLoading(false);
          setError(data.data?.error || 'Processing failed');
          toast.error('Processing failed');
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: nearAddress.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to start pipeline');
      }

      const data = await response.json();
      if (!data.taskId) {
        throw new Error('No taskId received from server');
      }

      setTaskId(data.taskId);
      startStatusPolling(data.taskId);

    } catch (error) {
      console.error('Failed to start processing:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
      toast.error('Failed to start processing');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" id="query-form">
        <div>
          <input
            type="text"
            id="near-address"
            name="near-address"
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
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-600">Processing...</span>
        </div>
      )}
    </div>
  );
}