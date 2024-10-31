'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

export default function QueryComponent() {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitting address:', nearAddress);
    setLoading(true);
    setResult(null);

    try {
      console.log('Making API request...');
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accountId: nearAddress.trim()
        })
      });

      console.log('Response received:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setResult(data);
      console.log('Setting result:', data);
      toast.success('Query submitted successfully');

    } catch (error) {
      console.error('Error in submission:', error);
      const message = error instanceof Error ? error.message : 'Failed to process query';
      toast.error(message);
    } finally {
      setLoading(false);
      console.log('Request completed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-black">Query Interface</h1>
      </div>

      <div className="bg-white/20 backdrop-blur-lg rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nearAddress" className="block text-sm font-medium text-black mb-1">
              NEAR Account Address
            </label>
            <input
              id="nearAddress"
              type="text"
              value={nearAddress}
              onChange={(e) => setNearAddress(e.target.value)}
              placeholder="example.near"
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black text-black"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !nearAddress.trim()}
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              loading || !nearAddress.trim() 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800 text-white'
            }`}
          >
            {loading ? 'Processing...' : 'Start Processing'}
          </button>
        </form>

        {result && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <h3 className="text-lg font-semibold text-black">Response Data:</h3>
            <pre className="mt-2 p-2 bg-black/20 rounded overflow-x-auto text-black">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}