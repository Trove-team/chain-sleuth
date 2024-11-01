'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QueryResults from '@/components/query/QueryResults';
import type { 
  ProcessingResponse, 
  QueryResult, 
  StatusResponse, 
  MetadataResponse 
} from '@/types/pipeline';

export default function QueryPage() {
    const [nearAddress, setNearAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ProcessingResponse | null>(null);
    const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
    const [progress, setProgress] = useState<number>(0);

    // Debug logging for state updates
    useEffect(() => {
        console.log('QueryResults state updated:', queryResults);
    }, [queryResults]);

    const fetchResults = async (accountId: string) => {
        console.log('Fetching results for account:', accountId);
        try {
            const metadataResponse = await fetch(`/api/pipeline/metadata/${accountId}`);
            if (!metadataResponse.ok) {
                throw new Error(`Metadata fetch failed: ${metadataResponse.statusText}`);
            }
            
            const metadataData: MetadataResponse = await metadataResponse.json();
            console.log('Received metadata:', metadataData);

            const queryResult: QueryResult = {
                accountId,
                timestamp: new Date().toISOString(),
                status: 'Completed',
                financialSummary: {
                    totalUsdValue: metadataData.wealth.totalUSDValue,
                    nearBalance: metadataData.wealth.balance.items
                        .find(i => i.symbol === "NEAR")?.amount.toString() || "0",
                    defiValue: metadataData.wealth.defi.totalUSDValue
                },
                analysis: {
                    transactionCount: metadataData.tx_count,
                    isBot: metadataData.bot_detection.isPotentialBot,
                    robustSummary: metadataData.robustSummary,
                    shortSummary: metadataData.shortSummary
                }
            };

            console.log('Setting new query result:', queryResult);
            setQueryResults(prev => {
                const newResults = [queryResult, ...prev];
                console.log('Updated queryResults:', newResults);
                return newResults;
            });
            
            toast.success('Processing completed');
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to fetch results');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setProgress(0);

        try {
            const response = await fetch('/api/pipeline/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    accountId: nearAddress.trim(),
                    webhookUrl: `${window.location.origin}/api/webhook/pipeline` 
                })
            });

            const data: ProcessingResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to start processing');
            }

            setResult(data);
            
            // Set up SSE connection
            const eventSource = new EventSource(`/api/pipeline/events/${data.taskId}`);
            
            eventSource.onmessage = (event) => {
                try {
                    const update: {
                        status: 'processing' | 'complete' | 'failed';
                        progress?: number;
                    } = JSON.parse(event.data);
                    
                    console.log('SSE Update:', update);
                    
                    if (update.progress !== undefined) {
                        setProgress(update.progress);
                    }
                    
                    if (update.status === 'complete') {
                        eventSource.close();
                        fetchResults(nearAddress.trim());
                    }
                } catch (error) {
                    console.error('Error processing SSE message:', error);
                    eventSource.close();
                    toast.error('Failed to process server update');
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                eventSource.close();
                toast.error('Lost connection to server');
            };

            return () => eventSource.close();
        } catch (error) {
            console.error('Error starting process:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to start processing');
        } finally {
            setLoading(false);
        }
    };

    // Add after line 56
    useEffect(() => {
        console.log('QueryResults being rendered with:', {
            resultsExist: queryResults.length > 0,
            firstResult: queryResults[0],
            totalResults: queryResults.length
        });
    }, [queryResults]);

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer 
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            
            <div className="max-w-2xl mx-auto space-y-8">
                <h1 className="text-2xl font-bold text-gray-900">NEAR Account Query</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={nearAddress}
                        onChange={(e) => setNearAddress(e.target.value)}
                        placeholder="Enter NEAR address"
                        className="w-full p-3 border rounded-lg"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !nearAddress.trim()}
                        className="w-full p-3 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
                    >
                        {loading ? 'Processing...' : 'Start Processing'}
                    </button>
                </form>

                {progress > 0 && progress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

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

                <div className="mt-8">
                    <QueryResults queries={queryResults} />
                </div>

                {result?.existingData && !queryResults.length && (
                    <div className="mt-4 space-y-2">
                        <h3 className="font-semibold">Existing Results:</h3>
                        <p>{result.existingData.shortSummary}</p>
                        <details>
                            <summary>Detailed Analysis</summary>
                            <p>{result.existingData.robustSummary}</p>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}