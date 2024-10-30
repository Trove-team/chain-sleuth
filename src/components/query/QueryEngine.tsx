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
    logger.info('Form submitted');
    
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setLoading(true);
    
    try {
      logger.info('Submitting query', { query });

      const result = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          accountId: undefined
        })
      });

      logger.info('Response received', { status: result.status });

      if (!result.ok) {
        const errorData = await result.json();
        logger.error('API Error', {
          status: result.status,
          error: errorData,
          query
        });
        throw new Error(errorData.error || `Server responded with ${result.status}`);
      }

      const data = await result.json();
      setResponse(data);
      toast.success('Query executed successfully');
      logger.info('Query completed successfully', { data });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      logger.error('Query error:', { error: errorMessage });
      toast.error(errorMessage);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold text-black">Natural Language Query</h2>
      <p className="text-sm text-gray-800">
        Enter your query in natural language (e.g., &quot;analyze transactions coming from near.wallet&quot;)
        <br />
        <span className="text-xs">(Press Ctrl + Enter to submit)</span>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter your query here..."
          className="w-full h-32 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
          disabled={loading}
        />
        
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Submit Query'}
        </button>
      </form>

      {response && (
        <div className="mt-6 bg-white/80 rounded-lg p-4">
          <h3 className="text-lg font-medium text-black mb-2">Results</h3>
          <pre className="whitespace-pre-wrap overflow-x-auto text-gray-800 bg-white p-4 rounded-lg">
            {JSON.stringify(response.results, null, 2)}
          </pre>
          {response.message && (
            <p className="mt-2 text-sm text-gray-800">{response.message}</p>
          )}
        </div>
      )}
    </div>
  );
}