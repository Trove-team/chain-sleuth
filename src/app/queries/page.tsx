'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

export default function QueryPage() {
    const [nearAddress, setNearAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/pipeline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId: nearAddress })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process request');
            }

            setResult(data);
            toast.success('Query submitted successfully');

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to process query';
            toast.error(message);
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
            {/* Add your query results component here */}
        </div>
    );
}