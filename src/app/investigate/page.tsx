'use client';

import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QueryComponent from '@/components/QueryComponent';
import QueryResults from '@/components/query/QueryResults';
import type { QueryResult } from '@/types/pipeline';

export default function InvestigatePage() {
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    console.log('QueryResults state updated:', queryResults);
  }, [queryResults]);

  const handleProcessingComplete = (result: QueryResult) => {
    setQueryResults(prev => [result, ...prev]);
    setProgress(0);
  };

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">NEAR Account Investigation</h1>
        
        <QueryComponent 
          onProgressUpdate={handleProgressUpdate}
          onProcessingComplete={handleProcessingComplete}
        />

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