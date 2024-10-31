'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

export default function QueryComponent() {
  const [nearAddress, setNearAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    console.group('Query Submission');
    console.log('Submitting address:', nearAddress);

    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: nearAddress })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setResult(data);
      toast.success('Query submitted successfully');

    } catch (error) {
      console.error('Error occurred:', error);
      const message = error instanceof Error ? error.message : 'Failed to process query';
      toast.error(message);
    } finally {
      setLoading(false);
      console.groupEnd();
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
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <h3 className="text-lg font-semibold">Response Data:</h3>
            <pre className="mt-2 p-2 bg-black/20 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}