// components/query/QueryInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { PipelineService } from '@/services/pipelineService';
import { DEFAULT_GAS, DEFAULT_DEPOSIT } from '@/constants/contract';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type WebhookType = 'progress' | 'completion' | 'error' | 'metadata_ready' | 'log';

interface InvestigationState {
  stage: 'idle' | 'requesting' | 'processing' | 'complete' | 'error' | 'existing';
  message: string;
  taskId?: string;
  token?: string;
  progress?: number;
  requestId?: string;
}

const pipelineService = new PipelineService();

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [status, setStatus] = useState<InvestigationState>({ stage: 'idle', message: '' });
  const { selector } = useWalletSelector();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selector) {
      toast.error('Please connect your wallet first');
      return;
    }

    setStatus({ stage: 'requesting', message: 'Starting investigation...' });

    try {
      const wallet = await selector.wallet();
      const activeAccount = selector.store.getState().accounts.find(
        account => account.active
      );

      if (!activeAccount) {
        throw new Error('No active account found');
      }

      // Start investigation - maps to test_start_investigation in test.rs (lines 31-53)
      const contractResult = await wallet.signAndSendTransaction({
        signerId: activeAccount.accountId,
        receiverId: process.env.NEXT_PUBLIC_CONTRACT_ID!,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'start_investigation',
            args: { target_account: nearAddress },
            gas: DEFAULT_GAS,
            deposit: DEFAULT_DEPOSIT
          }
        }]
      });

      if (!contractResult || !contractResult.status) {
        throw new Error('Contract call failed');
      }

      // Start pipeline processing
      const { transactionOutcome } = contractResult.status as { transactionOutcome: { outcome: { status: { SuccessValue: string } } } };
      const outcomeValue = JSON.parse(Buffer.from(transactionOutcome.outcome.status.SuccessValue, 'base64').toString());
      const requestId = outcomeValue.request_id;

      const { taskId, token } = await pipelineService.startProcessing(
        nearAddress,
        requestId
      );

      setStatus({ 
        stage: 'processing',
        message: 'Investigation started, analyzing on-chain data...',
        taskId,
        token,
        requestId,
        progress: 0
      });

      // Start polling for status updates
      startStatusPolling(taskId, requestId);

    } catch (error) {
      console.error('Error starting investigation:', error);
      setStatus({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Failed to start investigation'
      });
      toast.error('Failed to start investigation');
    }
  };

  const startStatusPolling = async (taskId: string, requestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const pipelineResponse = await fetch(`/api/pipeline/status/${taskId}`);
        const pipelineStatus = await pipelineResponse.json();
        
        setStatus(prev => ({
          ...prev,
          progress: pipelineStatus.progress || prev.progress
        }));

        switch (pipelineStatus.status) {
          case 'complete':
            const contractResponse = await fetch(`/api/near-contract/status/${requestId}`);
            const contractStatus = await contractResponse.json();
            
            if (contractStatus.status === 'complete') {
              clearInterval(pollInterval);
              setStatus(prev => ({
                ...prev,
                stage: 'complete',
                message: 'Investigation complete! View your NFT in the gallery.',
                progress: 100
              }));
            }
            break;

          case 'failed':
            clearInterval(pollInterval);
            setStatus(prev => ({
              ...prev,
              stage: 'error',
              message: pipelineStatus.error || 'Investigation failed',
              progress: 0
            }));
            break;
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
  };

  const getStatusColor = (stage: InvestigationState['stage']) => {
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
              placeholder="e.g. example.near"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              disabled={status.stage === 'processing'}
            />
            <button
              type="submit"
              disabled={!selector || status.stage === 'processing'}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors
                ${(!selector || status.stage === 'processing')
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
          <div className="flex flex-col w-full">
            <div className="flex items-center space-x-3">
              {status.stage === 'processing' && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
              )}
              <div className="flex flex-col">
                <span className="font-medium">Investigation Status</span>
                <span className={`text-sm ${getStatusColor(status.stage)}`}>
                  {status.message}
                </span>
              </div>
            </div>
            {status.stage === 'processing' && status.progress !== undefined && (
              <ProgressBar progress={status.progress} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
