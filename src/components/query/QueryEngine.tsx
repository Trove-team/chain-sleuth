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
  const [accountId, setAccountId] = useState('trovelabs.near');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const accountMatch = query.match(/\b[\w-]+\.near\b/);
      const targetAccount = accountMatch ? accountMatch[0] : accountId;

      console.log('Making API request to /api/query');
      console.log('Request payload:', { query, accountId: targetAccount });

      const result = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          accountId: targetAccount
        })
      });

      const responseText = await result.text();
      console.log('Response:', responseText);
      
      setResponse({
        success: result.ok,
        results: [responseText],
        message: result.ok ? 'Query executed successfully' : 'Query failed'
      });
      
      if (result.ok) {
        toast.success('Query executed successfully');
      } else {
        toast.error('Query failed');
      }

    } catch (error) {
      console.error('Query Error:', error);
      toast.error('Failed to execute query');
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
        Enter your query in natural language (e.g., &quot;analyze transactions for trovelabs.near&quot;)
        <br />
        <span className="text-xs">Include a .near account in your query or it will default to trovelabs.near</span>
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