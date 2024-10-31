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

const formatResponse = (responseText: string) => {
  try {
    // Parse the stringified JSON
    const parsed = JSON.parse(responseText);
    
    // Extract the synthesized response which contains the readable text
    const synthesizedResponse = parsed?.data?.data?.synthesized_response;
    
    if (synthesizedResponse) {
      // Split into sections based on headers
      const sections = synthesizedResponse.split(/(?=\n[A-Z][^a-z:]+:)/);
      
      return (
        <div className="space-y-4">
          {sections.map((section: string, index: number) => {
            const [header, ...content] = section.split('\n');
            return (
              <div key={index} className="border-b border-gray-200 pb-4">
                {header && (
                  <h3 className="font-semibold text-lg mb-2">{header.trim()}</h3>
                )}
                {content.map((paragraph: string, pIndex: number) => (
                  <p key={pIndex} className="mb-2">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Fallback to pretty-printed JSON
    return <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded-lg text-sm">
      {JSON.stringify(parsed, null, 2)}
    </pre>;
    
  } catch (error) {
    console.error('Response parsing error:', error);
    // If parsing fails, return the original text
    return <pre className="whitespace-pre-wrap text-red-500">
      {responseText}
    </pre>;
  }
};

export function QueryEngine() {
  const [query, setQuery] = useState('');
  const [accountId, setAccountId] = useState('trovelabs.near');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = performance.now();
    setLoading(true);
    
    console.group('Query Execution');
    console.log('Query:', query);
    
    try {
      const accountMatch = query.match(/\b[\w-]+\.near\b/);
      const targetAccount = accountMatch ? accountMatch[0] : accountId;

      console.log('Target Account:', targetAccount);
      console.time('Query Duration');

      const result = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          accountId: targetAccount
        })
      });

      console.timeEnd('Query Duration');
      const responseText = await result.text();
      const endTime = performance.now();
      
      console.log('Response Time:', `${(endTime - startTime).toFixed(2)}ms`);
      console.log('Response Status:', result.status);
      console.log('Raw Response:', responseText);

      if (responseText.includes('FUNCTION_INVOCATION_TIMEOUT')) {
        toast.error('Query took too long to complete. Please try a simpler query.');
        setResponse({
          success: false,
          results: ['Query timeout - please try a simpler query or try again later'],
          message: 'Query timed out'
        });
      } else {
        setResponse({
          success: result.ok,
          results: [responseText],
          message: result.ok ? 'Query executed successfully' : 'Query failed'
        });
      }

    } catch (error) {
      console.error('Query Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('aborted')) {
        toast.error('Query timed out. Please try again.');
      } else {
        toast.error('Failed to execute query');
      }
      
      setResponse({
        success: false,
        results: [`Error: ${errorMessage}`],
        message: 'Query failed'
      });
    } finally {
      console.groupEnd();
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
        <div className="mt-4 p-4 bg-white/10 rounded-lg">
          <div className="prose prose-invert max-w-none">
            {formatResponse(response.results[0])}
          </div>
        </div>
      )}
    </div>
  );
}