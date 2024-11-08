'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import type { QueryResult, MetadataResponse, ProcessingResponse } from '@/types/pipeline';
import { PipelineService } from '@/services/pipelineService';

interface QueryComponentProps {
  onProgressUpdate: (progress: number) => void;
  onProcessingComplete: (result: QueryResult) => void;
}

export default function QueryComponent({ onProgressUpdate, onProcessingComplete }: QueryComponentProps) {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTaskId(null);
    
    try {
        const pipelineService = PipelineService.getInstance();
        await pipelineService.initialize();
        
        pipelineService.on('progressUpdate', onProgressUpdate);
        pipelineService.on('processingComplete', onProcessingComplete);
        
        const result = await pipelineService.startProcessing(nearAddress.trim(), false);
        if (result.error) {
            throw new Error(result.error.message);
        }
        setTaskId(result.taskId);
    } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to start processing');
        console.error('Processing error:', error);
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
      
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      {taskId && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">
          Processing started: {taskId}
        </div>
      )}
      
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
  );
}