// components/query/QueryInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { WalletSelector } from "@near-wallet-selector/core";
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { 
  InvestigationStage,
  InvestigationProgress,
  requestInvestigation,
  checkInvestigationStatus,
  completeInvestigation,
  pollInvestigationStatus
} from '@/services/testInvestigationWorkflow';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [status, setStatus] = useState<InvestigationProgress>({ stage: 'idle', message: '' });
  const [requestId, setRequestId] = useState<string | null>(null);
  const { selector } = useWalletSelector();
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    const storedState = localStorage.getItem('investigationState');
    if (storedState) {
      const { address, requestId, stage } = JSON.parse(storedState);
      setNearAddress(address);
      setRequestId(requestId);
      setStatus({ stage, message: 'Resuming investigation...' });
      handleInvestigationContinuation(address, requestId, stage);
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!requestId || status.stage === 'complete' || status.stage === 'error') {
        return;
      }

      try {
        const progress = await checkInvestigationStatus(requestId);
        setStatus(progress);

        if (progress.stage === 'complete') {
          clearInterval(intervalId);
          localStorage.removeItem('investigationState');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setStatus({
          stage: 'error',
          message: 'Failed to check investigation status'
        });
        clearInterval(intervalId);
      }
    };

    if (requestId && status.stage !== 'complete' && status.stage !== 'error') {
      intervalId = setInterval(pollStatus, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [requestId, status.stage]);

  const handleInvestigationContinuation = async (
    address: string, 
    reqId: string, 
    stage: InvestigationStage
  ) => {
    if (!selector) {
      toast.error('Wallet selector is not initialized');
      return;
    }

    if (stage === 'investigation-started') {
      try {
        await completeInvestigation(reqId, selector as WalletSelector);
        setStatus({ stage: 'complete', message: 'Investigation completed and NFT minted' });
        toast.success('Investigation completed and NFT minted successfully!');
        localStorage.removeItem('investigationState');
      } catch (error) {
        console.error('Error completing investigation:', error);
        setStatus({ stage: 'error', message: 'Failed to complete investigation' });
        toast.error('Failed to complete investigation. Please try again later.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ stage: 'requesting', message: 'Requesting investigation...' });

    try {
      if (!selector) {
        throw new Error('Wallet selector is not initialized');
      }

      const response = await requestInvestigation(nearAddress, selector);
      setRequestId(response.request_id);

      if (response.is_existing) {
        setStatus({ stage: 'existing', message: 'Existing investigation found.' });
        toast.info('Existing investigation found.');
      } else {
        setStatus({ stage: 'investigation-started', message: 'Investigation started', requestId: response.request_id });
        toast.success('Investigation request successful.');
        
        // Store the state in localStorage
        localStorage.setItem('investigationState', JSON.stringify({
          address: nearAddress,
          requestId: response.request_id,
          stage: 'investigation-started'
        }));

        // Wait for a short period before attempting to complete the investigation
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
          setStatus({ stage: 'wallet-signing', message: 'Please confirm the completion transaction in your wallet...' });
          await completeInvestigation(response.request_id, selector);
          setStatus({ stage: 'complete', message: 'Investigation completed and NFT minted' });
          toast.success('Investigation completed and NFT minted successfully!');
          localStorage.removeItem('investigationState');
        } catch (completionError) {
          console.error('Error completing investigation:', completionError);
          setStatus({ stage: 'investigation-started', message: 'Investigation started, waiting for completion...' });
          toast.info('Investigation started. Please wait for completion or refresh the page if redirected.');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ stage: 'error', message: 'An error occurred: ' + (error instanceof Error ? error.message : String(error)) });
      toast.error('Failed to start investigation. Please try again.');
    }
  };

  const proceedWithCompletion = async (reqId: string) => {
    try {
      setStatus({
        stage: 'wallet-signing',
        message: 'Please confirm the transaction in your wallet...'
      });

      if (!selector) {
        throw new Error('Wallet selector is not initialized');
      }

      await completeInvestigation(reqId, selector);

      setStatus({
        stage: 'complete',
        message: 'Investigation completed successfully!'
      });
      toast.success('Transaction successful!');
    } catch (error) {
      console.error('Completion error:', error);
      toast.error('Transaction failed. Please try again.');
      setStatus({
        stage: 'error',
        message: 'Failed to complete investigation. Please try again.'
      });
    }
  };

  const getStatusColor = (stage: InvestigationStage) => {
    switch (stage) {
      case 'error':
        return 'text-red-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
     <form onSubmit={handleSubmit} className="space-y-4 bg-transparent p-6 rounded-lg">
        <div className="flex flex-col space-y-2">
          <label htmlFor="nearAddress" className="text-lg font-medium">
            Enter NEAR Address to Investigate
          </label>
          <div className="flex space-x-2">
            <input
              id="nearAddress"
              type="text"
              value={nearAddress}
              onChange={(e) => setNearAddress(e.target.value)}
              placeholder="e.g. example.testnet"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              disabled={!!requestId && status.stage !== 'error'}
            />
            <button
              type="submit"
              disabled={!selector || (!!requestId && status.stage !== 'error')}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors
                ${(!selector || (!!requestId && status.stage !== 'error'))
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'}
              `}
            >
              {!selector ? 'Connect Wallet First' : 'Investigate'}
            </button>
          </div>
        </div>
      </form>

      {status.stage !== 'idle' && (
        <div className="bg-white shadow-md rounded-lg p-4 mt-4">
          <div className="flex items-center space-x-3">
            {status.stage !== 'error' && status.stage !== 'complete' && (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            )}
            <div className="flex flex-col">
              <span className="font-medium">Investigation Status</span>
              <span className={`text-sm ${getStatusColor(status.stage)}`}>
                {status.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {isExisting && requestId && (
        <div className="mt-4">
          <p>This address has already been investigated. Would you like to:</p>
          <button
            onClick={() => {/* Logic to view existing results */}}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            View Existing Results
          </button>
          <button
            onClick={() => proceedWithCompletion(requestId)}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Proceed with New Investigation
          </button>
        </div>
      )}
    </div>
  );
}
