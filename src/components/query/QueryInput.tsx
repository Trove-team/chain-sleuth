// components/query/QueryInput.tsx
'use client';

import { useState } from 'react';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { PipelineService } from '@/services/pipelineService';
import { DEFAULT_GAS, DEFAULT_DEPOSIT, CONTRACT_METHODS } from '@/constants/contract';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AccountState } from "@near-wallet-selector/core";
import type { Wallet } from "@near-wallet-selector/core";

interface InvestigationState {
  stage: 'idle' | 'requesting' | 'processing' | 'complete' | 'error' | 'existing';
  message: string;
  taskId?: string;
  token?: string;
  progress?: number;
  requestId?: string;
}

interface TransactionResult {
  response?: {
    status: {
      SuccessValue?: string;
      Failure?: any;
    };
  };
}

interface InvestigationResponse {
  request_id: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  message?: string;
}

interface PipelineStatus {
  status: 'processing' | 'complete' | 'failed';
  data: {
    accountId: string;
    taskId: string;
    progress?: number;
    message?: string;
    error?: string;
    status: 'processing' | 'complete' | 'failed';
  };
}

interface ContractStatus {
  status: 'complete' | 'processing' | 'failed';
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
      const wallet = (await selector.wallet()) as Wallet;
      const activeAccount = selector.store.getState().accounts.find(
        (account: AccountState) => account.active
      );

      if (!activeAccount) {
        throw new Error('No active account found');
      }

      // Start contract investigation
      const contractResult = await wallet.signAndSendTransaction({
        signerId: activeAccount.accountId,
        receiverId: process.env.NEXT_PUBLIC_CONTRACT_ID!,
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: CONTRACT_METHODS.START_INVESTIGATION,
            args: { target_account: nearAddress },
            gas: DEFAULT_GAS,
            deposit: DEFAULT_DEPOSIT
          }
        }]
      }) as TransactionResult;

      if (!contractResult.response?.status.SuccessValue) {
        throw new Error('Transaction failed or returned no value');
      }

      // Parse contract response
      const resultJson = Buffer.from(contractResult.response.status.SuccessValue, 'base64').toString();
      const response = JSON.parse(resultJson) as InvestigationResponse;

      // Start pipeline processing
      const { taskId } = await pipelineService.startProcessing(
        nearAddress,
        response.request_id
      );

      setStatus({ 
        stage: 'processing', 
        message: 'Investigation started, analyzing on-chain data...',
        taskId,
        requestId: response.request_id,
        progress: 0
      });

      // Start polling
      startStatusPolling(taskId, response.request_id);

    } catch (error) {
      console.error('Investigation failed:', error);
      setStatus({ 
        stage: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      toast.error('Failed to start investigation');
    }
  };

  const startStatusPolling = async (taskId: string, requestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check pipeline status
        const pipelineResponse = await fetch(`/api/pipeline/status/${taskId}`);
        const pipelineStatus = await pipelineResponse.json() as PipelineStatus;
        
        // Update progress if available
        if (pipelineStatus.data?.progress !== undefined) {
          setStatus(prev => ({
            ...prev,
            progress: pipelineStatus.data.progress
          }));
        }

        if (pipelineStatus.status === 'complete') {
          // Check contract status
          const contractResponse = await fetch(`/api/near-contract/status/${requestId}`);
          const contractStatus = await contractResponse.json() as ContractStatus;
          
          if (contractStatus.status === 'complete') {
            clearInterval(pollInterval);
            setStatus(prev => ({
              ...prev,
              stage: 'complete',
              message: 'Investigation complete! View your NFT in the gallery.',
              progress: 100
            }));
            toast.success('Investigation completed successfully!');
          }
        } else if (pipelineStatus.status === 'failed') {
          clearInterval(pollInterval);
          setStatus(prev => ({
            ...prev,
            stage: 'error',
            message: pipelineStatus.data?.error || 'Investigation failed',
            progress: 0
          }));
          toast.error('Investigation failed');
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    }, 5000);

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
      <form onSubmit={handleSubmit} className="space-y-4 bg-white/20 backdrop-blur-lg rounded-lg p-6">
        <div className="flex flex-col space-y-2">
          <label htmlFor="nearAddress" className="text-lg font-medium text-black">
            Enter NEAR Address to Investigate
          </label>
          <div className="flex space-x-2">
            <input
              id="nearAddress"
              type="text"
              value={nearAddress}
              onChange={(e) => setNearAddress(e.target.value)}
              placeholder="e.g. example.near"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent text-black bg-white"
              disabled={status.stage === 'processing'}
            />
            <button
              type="submit"
              disabled={!selector || status.stage === 'processing'}
              className={`px-6 py-2 bg-black text-white rounded-lg transition-colors
                ${(!selector || status.stage === 'processing')
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-800'}
              `}
            >
              {!selector ? 'Connect Wallet First' : 'Investigate'}
            </button>
          </div>
        </div>
      </form>

      {status.stage !== 'idle' && (
        <div className="bg-white/20 backdrop-blur-lg rounded-lg p-4 mt-4">
          <div className="flex flex-col w-full">
            <div className="flex items-center space-x-3">
              {status.stage === 'processing' && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black" />
              )}
              <div className="flex flex-col">
                <span className="font-medium text-black">Investigation Status</span>
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