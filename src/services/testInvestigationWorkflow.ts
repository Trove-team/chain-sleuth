// src/services/testInvestigationWorkflow.ts

import { WalletSelector } from "@near-wallet-selector/core";
import { 
  CONTRACT_ID, 
  CONTRACT_METHODS,
  DEFAULT_GAS,
  DEFAULT_DEPOSIT,
  COMPLETE_INVESTIGATION_DEPOSIT
} from '@/constants/contract';

// Update the Wallet interface to match the actual structure
interface Wallet {
  signAndSendTransaction(params: {
    receiverId: string;
    actions: {
      type: string;
      params: {
        methodName: string;
        args: any;
        gas: string;
        deposit: string;
      };
    }[];
  }): Promise<any>; // Change the return type if you know the exact type
}

type InvestigationStage = "idle" | "requesting" | "wallet-signing" |
  "investigation-started" | "investigation-in-progress" | "investigation-complete" | "minting" | "complete" | "error" |
  "existing";

export type InvestigationProgress = {
  stage: InvestigationStage;
  message: string;
  requestId?: string;
  data?: any;
};

export async function requestInvestigation(address: string, selector: WalletSelector): Promise<{ request_id: string, is_existing: boolean }> {
  console.log('Requesting investigation for address:', address);
  try {
    const wallet = await selector.wallet();
    const result = await wallet.signAndSendTransaction({
      receiverId: CONTRACT_ID,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: CONTRACT_METHODS.REQUEST_INVESTIGATION,
            args: { target_account: address },
            gas: DEFAULT_GAS,
            deposit: DEFAULT_DEPOSIT
          }
        }
      ]
    });

    console.log('Transaction result:', result);

    if (result && result.transaction && result.transaction.hash) {
      console.log('Investigation requested, transaction hash:', result.transaction.hash);
      
      // Parse the result to get the request_id and is_existing flag
      const response = JSON.parse(Buffer.from(result.transaction.receipts_outcome[0].outcome.status.SuccessValue, 'base64').toString());
      return {
        request_id: response.request_id,
        is_existing: response.is_existing
      };
    } else {
      throw new Error('Failed to get transaction result');
    }
  } catch (error) {
    console.error('Error in requestInvestigation:', error);
    throw error;
  }
}

export async function checkInvestigationStatus(requestId: string): Promise<InvestigationProgress> {
  const response = await fetch(`/api/near-contract/test-investigation/status?requestId=${requestId}`);
  
  if (!response.ok) {
    throw new Error('Failed to check investigation status');
  }

  return response.json();
}

export async function completeInvestigation(requestId: string, selector: WalletSelector): Promise<void> {
  console.log('Completing investigation for request ID:', requestId);
  try {
    const wallet = await selector.wallet();
    const result = await wallet.signAndSendTransaction({
      receiverId: CONTRACT_ID,
      actions: [{
        type: 'FunctionCall',
        params: {
          methodName: CONTRACT_METHODS.COMPLETE_INVESTIGATION,
          args: { 
            request_id: requestId,
            robust_summary: "Mock robust summary",
            short_summary: "Mock short summary"
          },
          gas: DEFAULT_GAS,
          deposit: COMPLETE_INVESTIGATION_DEPOSIT
        }
      }]
    });

    console.log('Completion transaction result:', result);
  } catch (error) {
    console.error('Error completing investigation:', error);
    throw error;
  }
}

export async function pollInvestigationStatus(requestId: string): Promise<InvestigationProgress> {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkInvestigationStatus(requestId);
    if (status.stage === 'investigation-complete' || status.stage === 'error') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
  }

  throw new Error('Investigation timed out');
}

export type {
  InvestigationStage,
};
