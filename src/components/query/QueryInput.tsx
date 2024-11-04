// components/query/QueryInput.tsx
'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface InvestigationState {
  stage: 'idle' | 'requesting' | 'processing' | 'complete' | 'error';
  message: string;
  taskId?: string;
  progress?: number;
}

interface PipelineStatus {
  status: 'processing' | 'complete' | 'failed';
  data: {
    accountId: string;
    taskId: string;
    progress?: number;
    message?: string;
    error?: string;
    status: 'processing' | 'complete' | 'failed';
  };
}

const startProcessing = async (accountId: string) => {
  const response = await fetch('/api/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId })
  });
  return response.json();
};

const checkStatus = async (taskId: string) => {
  const response = await fetch(`/api/pipeline?taskId=${taskId}`);
  return response.json();
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [status, setStatus] = useState<InvestigationState>({ stage: 'idle', message: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setStatus({ stage: 'requesting', message: 'Starting investigation...' });

    try {
      const { taskId } = await startProcessing(nearAddress);

      setStatus({ 
        stage: 'processing', 
        message: 'Investigation started, analyzing on-chain data...',
        taskId,
        progress: 0
      });

      startStatusPolling(taskId);

    } catch (error) {
      console.error('Investigation failed:', error);
      setStatus({ 
        stage: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      toast.error('Failed to start investigation');
    }
  };

  const startStatusPolling = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const pipelineStatus = await checkStatus(taskId);
        
        if (pipelineStatus.data?.progress !== undefined) {
          setStatus(prev => ({
            ...prev,
            progress: pipelineStatus.data.progress
          }));
        }

        if (pipelineStatus.status === 'complete') {
          clearInterval(pollInterval);
          setStatus(prev => ({
            ...prev,
            stage: 'complete',
            message: 'Investigation complete! View results in the graph.',
            progress: 100
          }));
          toast.success('Investigation completed successfully!');
        } else if (pipelineStatus.status === 'failed') {
          clearInterval(pollInterval);
          setStatus(prev => ({
            ...prev,
            stage: 'error',
            message: pipelineStatus.data?.error || 'Investigation failed',
            progress: 0
          }));
          toast.error('Investigation failed');
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  };

  const getStatusColor = (stage: InvestigationState['stage']) => {
    switch (stage) {
      case 'error':
        return 'text-red-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 bg-query-box rounded-lg p-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Natural Language Query</h2>
            <p className="text-sm text-gray-700 mb-4">
              Enter your query in natural language (e.g., &quot;analyze transactions for trovelabs.near&quot;)
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Include a .near account in your query or it will default to trovelabs.near
            </p>
          </div>
          
          <textarea
            id="nearAddress"
            value={nearAddress}
            onChange={(e) => setNearAddress(e.target.value)}
            placeholder="analyze the largest transactions for trovelabs.near"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900 bg-white min-h-[100px] resize-none"
            disabled={status.stage === 'processing'}
          />
          
          <button
            type="submit"
            disabled={status.stage === 'processing'}
            className={`w-full px-6 py-3 bg-gray-900 text-white rounded-lg transition-colors
              ${status.stage === 'processing'
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-800'}
            `}
          >
            Submit Query
          </button>
        </div>
      </form>

      {status.stage !== 'idle' && (
        <div className="bg-query-box rounded-lg p-4 mt-4">
          <div className="flex flex-col w-full">
            <div className="flex items-center space-x-3">
              {status.stage === 'processing' && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900" />
              )}
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">Query Status</span>
                <span className={`text-sm ${getStatusColor(status.stage)}`}>
                  {status.message}
                </span>
              </div>
            </div>
            {status.progress !== undefined && (
              <div className="mt-3">
                <ProgressBar progress={status.progress} />
                <p className="text-sm text-gray-700 mt-1">
                  Processing: {status.progress}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}