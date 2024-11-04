'use client';

import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QueryComponent from '@/components/QueryComponent';
import QueryResults from '@/components/query/QueryResults';
import type { QueryResult } from '@/types/pipeline';

export default function QueriesPage() {
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('QueryResults state updated:', queryResults);
  }, [queryResults]);

  const handleProcessingComplete = (result: QueryResult) => {
    console.log('Processing complete, result:', result);
    setQueryResults(prev => [result, ...prev]);
    setProgress(0);
    setLoading(false);
  };

  const handleProgressUpdate = (newProgress: number) => {
    console.log('Progress update:', newProgress);
    setProgress(newProgress);
    setLoading(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">NEAR Account Investigation</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <QueryComponent 
            onProgressUpdate={handleProgressUpdate}
            onProcessingComplete={handleProcessingComplete}
          />
        </div>

        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Processing account data...</p>
          </div>
        )}

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <QueryResults queries={queryResults} />
      </div>
    </div>
  );
}