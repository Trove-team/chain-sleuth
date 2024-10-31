'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { ProcessingResponse, StatusResponse } from '@/services/pipelineService';

export default function QueryComponent() {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResponse | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const startStatusPolling = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pipeline?taskId=${taskId}`);
        const status: StatusResponse = await response.json();
        
        if (status.data?.progress !== undefined) {
          setProgress(status.data.progress);
        }

        if (status.status === 'complete' || status.status === 'failed') {
          clearInterval(pollInterval);
          if (status.status === 'complete') {
            toast.success('Processing completed');
          } else {
            toast.error(status.data?.error || 'Processing failed');
          }
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
        
        setResult(await reprocessResponse.json());
      } else {
        setResult(data);
      }

      if (data.taskId) {
        startStatusPolling(data.taskId);
        toast.success(`Processing started - Task ID: ${data.taskId}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process account');
    } finally {
      setLoading(false);
    }
  };

  return (
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
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </form>
  );
}