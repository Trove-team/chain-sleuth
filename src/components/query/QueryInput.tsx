// components/query/QueryInput.tsx
'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PipelineService } from '@/services/pipelineService';
import type { QueryResult } from '@/types/pipeline';

interface InvestigationState {
  stage: 'idle' | 'requesting' | 'processing' | 'complete' | 'error';
  message: string;
  taskId?: string;
  progress?: number;
}

// Define the event handler types
type ProgressUpdateHandler = (progress: number) => void;
type ProcessingCompleteHandler = (result: QueryResult) => void;

const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 600000; // 10 minutes

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

  const onProgressUpdate: ProgressUpdateHandler = (progress) => {
    setStatus(prev => ({
      ...prev,
      progress,
      stage: 'processing',
      message: `Processing: ${progress}% complete`
    }));
  };

  const onProcessingComplete: ProcessingCompleteHandler = (result) => {
    setStatus({
      stage: 'complete',
      message: 'Investigation complete! View results in the graph.',
      progress: 100
    });
    toast.success('Investigation completed successfully!');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setStatus({ stage: 'requesting', message: 'Starting investigation...' });

    try {
      const pipelineService = PipelineService.getInstance();
      await pipelineService.initialize();
      
      // Type-safe event handlers
      pipelineService.on('progressUpdate', onProgressUpdate);
      pipelineService.on('processingComplete', onProcessingComplete);
      
      const response = await pipelineService.startProcessing(nearAddress.trim());
      
      if (response.status === 'error') {
        throw new Error(response.error?.message || 'Processing failed');
      }
      
      if (!response.taskId) {
        throw new Error('No task ID received from server');
      }

      setStatus(prev => ({
        ...prev,
        taskId: response.taskId,
        stage: 'processing',
        message: 'Processing started...',
        progress: 0
      }));

      startStatusPolling(response.taskId);
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setStatus({ 
        stage: 'error', 
        message: errorMessage 
      });
      toast.error(errorMessage);
    }
  };

  const startStatusPolling = async (taskId: string) => {
    const startTime = Date.now();
    const pollInterval = setInterval(async () => {
      try {
        // Check if we've exceeded maximum polling time
        if (Date.now() - startTime > MAX_POLLING_TIME) {
          clearInterval(pollInterval);
          setStatus(prev => ({
            ...prev,
            stage: 'error',
            message: 'Processing timed out after 10 minutes',
            progress: 0
          }));
          toast.error('Processing timed out');
          return;
        }

        const pipelineService = PipelineService.getInstance();
        const pipelineStatus = await pipelineService.checkStatus(taskId);
        
        if (pipelineStatus.data?.progress !== undefined) {
          setStatus(prev => ({
            ...prev,
            progress: pipelineStatus.data.progress || 0
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
        // Don't clear interval on transient errors, only if max time exceeded
        if (Date.now() - startTime > MAX_POLLING_TIME) {
          clearInterval(pollInterval);
          toast.error('Status check failed');
        }
      }
    }, POLLING_INTERVAL);

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