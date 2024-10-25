// components/query/QueryInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { utils } from "near-api-js";
import { CONTRACT_ID } from '@/constants/contract';
import { 
  InvestigationStage,
  InvestigationProgress,
  requestInvestigation,
  checkInvestigationStatus,
  completeInvestigation
} from '@/services/testInvestigationWorkflow';

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [status, setStatus] = useState<InvestigationProgress>({ 
    stage: 'requesting',
    message: '' 
  });
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const { selector, accountId } = useWalletSelector();

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
      intervalId = setInterval(pollStatus, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [requestId, status.stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearAddress.trim() || !accountId || !selector) {
      console.log('Missing required data:', { nearAddress, accountId, selector: !!selector });
      return;
    }

    try {
      setStatus({
        stage: 'requesting',
        message: 'Requesting investigation...'
      });

      // Step 1: Request Investigation
      const newRequestId = await requestInvestigation(nearAddress);
      setRequestId(newRequestId);

      // Step 2: Check if investigation already exists
      const investigationStatus = await checkInvestigationStatus(newRequestId);
      
      if (investigationStatus.stage === 'complete') {
        setIsExisting(true);
        setStatus({
          stage: 'existing',
          message: 'This address has already been investigated.'
        });
      } else {
        // Step 3: Proceed with completion for new investigations
        await proceedWithCompletion(newRequestId);
      }

    } catch (error) {
      console.error('Investigation error:', error);
      setStatus({
        stage: 'error',
        message: 'Failed to process investigation. Please try again.'
      });
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

      const wallet = await selector.wallet();

      // Send 0.05 NEAR deposit and complete the investigation
      const deposit = utils.format.parseNearAmount('0.05');
      if (!deposit) throw new Error('Failed to parse NEAR amount');

      await wallet.signAndSendTransaction({
        signerId: accountId!,
        receiverId: CONTRACT_ID,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'complete_investigation',
            args: { request_id: reqId },
            gas: '300000000000000',
            deposit: deposit
          }
        }]
      });

      // Simulate completion with test route
      await completeInvestigation(reqId);

      setStatus({
        stage: 'complete',
        message: 'Investigation completed successfully!'
      });
    } catch (error) {
      console.error('Completion error:', error);
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!!requestId && status.stage !== 'error'}
            />
            <button
              type="submit"
              disabled={!accountId || (!!requestId && status.stage !== 'error')}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors
                ${(!accountId || (!!requestId && status.stage !== 'error'))
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'}
              `}
            >
              {!accountId ? 'Connect Wallet First' : 'Investigate'}
            </button>
          </div>
        </div>
      </form>

      {status.stage !== 'requesting' && (
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {status.stage !== 'error' && status.stage !== 'complete' && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
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

      {isExisting && (
        <div className="mt-4">
          <p>This address has already been investigated. Would you like to:</p>
          <button
            onClick={() => {/* Logic to view existing results */}}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            View Existing Results
          </button>
          <button
            onClick={() => proceedWithCompletion(requestId!)}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Proceed with New Investigation
          </button>
        </div>
      )}
    </div>
  );
}
