'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { ProcessingResponse, StatusResponse } from '@/services/pipelineService';

interface ProcessingMetadata {
  financialSummary: {
    nearBalance: string;
    totalUsdValue: string;
    defiValue: string;
  };
  analysisSummary: {
    transactionCount: number;
    isBot: boolean;
    robustSummary: string | null;
    shortSummary: string | null;
  };
}

export default function QueryComponent() {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResponse | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [metadata, setMetadata] = useState<ProcessingMetadata | null>(null);

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
          // Fetch metadata once processing is complete
          const metadataResponse = await fetch(`/api/pipeline/metadata/${nearAddress}`);
          const metadataData = await metadataResponse.json();
          
          setMetadata({
            financialSummary: {
              nearBalance: metadataData.financial_summary.near_balance,
              totalUsdValue: metadataData.financial_summary.total_usd_value,
              defiValue: metadataData.financial_summary.defi_value
            },
            analysisSummary: {
              transactionCount: metadataData.analysis_summary.transaction_count,
              isBot: metadataData.analysis_summary.is_bot,
              robustSummary: metadataData.analysis_summary.robust_summary,
              shortSummary: metadataData.analysis_summary.short_summary
            }
          });
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
      {metadata && (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 space-y-6">
          {/* Financial Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Financial Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">NEAR Balance</p>
                <p className="font-medium">Ⓝ {metadata.financialSummary.nearBalance}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="font-medium">${metadata.financialSummary.totalUsdValue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">DeFi Value</p>
                <p className="font-medium">${metadata.financialSummary.defiValue}</p>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Analysis Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Transaction Count: {metadata.analysisSummary.transactionCount}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  metadata.analysisSummary.isBot ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {metadata.analysisSummary.isBot ? 'Potential Bot' : 'Human Activity'}
                </span>
              </div>
              
              {metadata.analysisSummary.shortSummary && (
                <div>
                  <h4 className="font-medium mb-2">Quick Summary</h4>
                  <p className="text-sm text-gray-700">{metadata.analysisSummary.shortSummary}</p>
                </div>
              )}
              
              {metadata.analysisSummary.robustSummary && (
                <div>
                  <h4 className="font-medium mb-2">Detailed Analysis</h4>
                  <p className="text-sm text-gray-700">{metadata.analysisSummary.robustSummary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Existing Data Display */}
      {result?.existingData && !metadata && (
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