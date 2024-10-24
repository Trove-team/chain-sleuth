// components/query/QueryInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { utils } from "near-api-js";
import { 
  InvestigationStage,
  InvestigationProgress,
  requestInvestigation,
  checkInvestigationStatus,
  completeInvestigation
} from '@/services/testInvestigationWorkflow';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'chainsleuth2.testnet';

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [status, setStatus] = useState<InvestigationProgress>({ 
    stage: 'requesting',
    message: '' 
  });
  const [requestId, setRequestId] = useState<string | null>(null);
  const router = useRouter();
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
          await completeInvestigation(requestId);
          setTimeout(() => {
            router.push('/queries');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setStatus({
          stage: 'error',
          message: 'Failed to check investigation status'
        });
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
  }, [requestId, status.stage, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearAddress.trim() || !accountId) return;

    try {
      setStatus({
        stage: 'wallet-signing',
        message: 'Please confirm the transaction...'
      });

      // Get the wallet
      const wallet = await selector.wallet();
      
      // Call the contract
      await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: CONTRACT_ID,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'request_investigation',
            args: { target_account: nearAddress },
            gas: '300000000000000',
            deposit: utils.format.parseNearAmount('1')
          }
        }]
      });

      // After successful transaction, start the test flow
      const newRequestId = await requestInvestigation(nearAddress);
      setRequestId(newRequestId);
      
      setStatus({
        stage: 'investigation-started',
        message: 'Investigation started...',
        requestId: newRequestId
      });

    } catch (error) {
      console.error('Investigation error:', error);
      setStatus({
        stage: 'error',
        message: 'Failed to start investigation. Please try again.'
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
    </div>
  );
}