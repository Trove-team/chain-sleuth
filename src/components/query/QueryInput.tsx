// components/query/QueryInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWalletSelector } from "@/context/WalletSelectorContext";
import { PipelineService } from '@/services/pipelineService';
import { initInvestigationContract, createInitialMetadata, DEFAULT_GAS, DEFAULT_DEPOSIT } from '@/constants/contract';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type InvestigationStage = 'idle' | 'requesting' | 'processing' | 'complete' | 'error' | 'existing';

interface InvestigationState {
  stage: InvestigationStage;
  message: string;
  taskId?: string;
  token?: string;
}

const pipelineService = new PipelineService();

export default function QueryInput() {
  const [nearAddress, setNearAddress] = useState('');
  const [status, setStatus] = useState<InvestigationState>({ stage: 'idle', message: '' });
  const { selector } = useWalletSelector();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selector) {
      toast.error('Please connect your wallet first');
      return;
    }

    setStatus({ stage: 'requesting', message: 'Starting investigation...' });

    try {
      // 1. Get the active account from the context
      const activeAccount = selector.store.getState().accounts.find(
        (account) => account.active
      );

      if (!activeAccount) {
        throw new Error('No active account found');
      }

      // 2. Start contract interaction (mint placeholder NFT)
      const wallet = await selector.wallet();
      const contractResponse = await fetch('/api/near-contract/investigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_account: nearAddress,
          deposit: "1" // or whatever deposit amount you want to use
        })
      });

      const { data: contractResult } = await contractResponse.json();
      
      if (!contractResult?.taskId) {
        throw new Error('Failed to start contract investigation');
      }

      setStatus({ 
        stage: 'processing', 
        message: 'Investigation started, analyzing on-chain data...',
        taskId: contractResult.taskId 
      });

      // 3. Start polling for status
      startStatusPolling(contractResult.taskId);

    } catch (error) {
      console.error('Error starting investigation:', error);
      setStatus({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Failed to start investigation'
      });
      toast.error('Failed to start investigation');
    }
  };

  const startStatusPolling = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/near-contract/investigate/status?taskId=${taskId}`);
        const status = await response.json();
        
        if (status.stage === 'investigation-complete') {
          clearInterval(pollInterval);
          setStatus({
            stage: 'complete',
            message: 'Investigation complete! NFT has been minted with results.',
            taskId
          });
          toast.success('Investigation completed successfully!');
        } else if (status.stage === 'error') {
          clearInterval(pollInterval);
          setStatus({
            stage: 'error',
            message: status.message || 'Investigation failed',
            taskId
          });
          toast.error('Investigation failed');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        clearInterval(pollInterval);
        setStatus({
          stage: 'error',
          message: 'Failed to check investigation status'
        });
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
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
          <div className="flex items-center space-x-3">
            {status.stage === 'processing' && (
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
    </div>
  );
}
