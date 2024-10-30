'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { createLogger } from '@/utils/logger';

const logger = createLogger('query-engine-component');

interface QueryResponse {
  success: boolean;
  results: any[];
  message: string;
}

export function QueryEngine() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      logger.info('Submitting query', { query });

      const result = await fetch('/api/query-engine/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          accountId: undefined // Optional, can be added if needed
        })
      });

      const data = await result.json();
      
      if (!result.ok) {
        throw new Error(data.error || 'Failed to process query');
      }

      setResponse(data);
      toast.success('Query executed successfully');
      logger.info('Query completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      logger.error('Query error:', { error: errorMessage });
      toast.error(errorMessage);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-black">Natural Language Query</h2>
      <p className="text-sm text-gray-600">
        Enter your query in natural language (e.g., &quot;analyze transactions coming from near.wallet&quot;)
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
          className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Submit Query'}
        </button>
      </form>

      {response && (
        <div className="mt-6 bg-white/40 rounded-lg p-4">
          <h3 className="text-lg font-medium text-black mb-2">Results</h3>
          <pre className="whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(response.results, null, 2)}
          </pre>
          {response.message && (
            <p className="mt-2 text-sm text-gray-600">{response.message}</p>
          )}
        </div>
      )}
    </div>
  );
}