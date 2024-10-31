'use client';

import { useState } from 'react';
import { PipelineService } from '@/services/pipelineService';
import { toast } from 'react-toastify';
import QueryResults from '@/components/query/QueryResults';

const pipelineService = new PipelineService();

interface QueryResult {
  taskId: string;
  status: string;
  message?: string;
  data?: any;
}

export default function QueryPage() {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queries, setQueries] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await pipelineService.startProcessing(nearAddress);
      
      if (response.status === 'error') {
        toast.error(response.error?.message || 'Processing failed');
        setResult({
          taskId: response.taskId,
          status: 'error',
          message: response.error?.message
        });
        return;
      }

      // Add the new query to the list
      const newQuery = {
        taskId: response.taskId,
        accountId: nearAddress,
        timestamp: new Date().toISOString(),
        status: response.existingData ? 'Completed' : 'Processing'
      };
      
      setQueries(prev => [newQuery, ...prev]);
      
      setResult({
        taskId: response.taskId,
        status: 'success',
        message: response.existingData 
          ? 'Found existing data'
          : 'Processing started successfully',
        data: response.existingData
      });
      
      toast.success('Query submitted successfully');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process query';
      toast.error(message);
      setResult({
        taskId: 'error',
        status: 'error',
        message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Query Input Section */}
      <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-black mb-6">NEAR Account Query</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nearAddress" className="block text-sm font-medium text-gray-700 mb-1">
              NEAR Account Address
            </label>
            <input
              id="nearAddress"
              type="text"
              value={nearAddress}
              onChange={(e) => setNearAddress(e.target.value)}
              placeholder="example.near"
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !nearAddress.trim()}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              loading || !nearAddress.trim() 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
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

      {/* Query Results Section */}
      {queries.length > 0 && (
        <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6">
          <QueryResults queries={queries} />
        </div>
      )}
    </div>
  );
}