// src/services/testInvestigationWorkflow.ts

import { WalletSelector } from "@near-wallet-selector/core";
import { 
  CONTRACT_ID, 
  CONTRACT_METHODS,
  DEFAULT_GAS,
  DEFAULT_DEPOSIT 
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
  "investigation-started" | "investigation-in-progress" |
  "investigation-complete" | "minting" | "complete" | "error" |
  "existing";

export type InvestigationProgress = {
  stage: InvestigationStage;
  message: string;
  requestId?: string;
  data?: any;
};

export async function requestInvestigation(address: string, selector: WalletSelector): Promise<string> {
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

    if (result && result.transaction && result.transaction.hash) {
      console.log('Investigation requested, transaction hash:', result.transaction.hash);
      return result.transaction.hash;
    } else {
      throw new Error('Failed to get transaction hash');
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

export async function completeInvestigation(requestId: string, deposit: string, selector: WalletSelector): Promise<void> {
  try {
    const wallet = await selector.wallet();

    // Extract the actual NEAR address from the requestId
    const nearAddress = requestId.split(':')[1];
    console.log('Completing investigation for address:', nearAddress);

    // Create mock summaries with actual account
    const mockRobustSummary = `Comprehensive, Detailed Summary:\n\nThe account ${nearAddress} is a highly active participant in the NEAR Protocol blockchain, with a creation date of January 18, 2022, and a total of 1556 transactions. This account is primarily engaged in decentralized finance (DeFi) activities, with significant investments in meme tokens through Ref Finance, contributing to a total USD value of $63,547.60. The account's wealth is diversified across several tokens, including NEAR, USDC, and NEKO, with NEKO comprising the largest portion of the balance. Despite its high transaction volume, the account is not flagged as a bot, indicating genuine user activity. The account has a probable Ethereum address linkage, suggesting cross-chain interactions. The transaction history reveals significant interactions with Ref Finance and wrap.near, with a notable presence in NFT-related transactions, particularly with the Good Fortune Felines collection. The account's activities suggest a focus on both trading and collecting NFTs, along with active participation in cross-chain bridging and token transfers. This diverse engagement highlights the account's strategic approach to leveraging blockchain opportunities.`;

    const mockShortSummary = `Neo4j-Friendly Metadata Summary:\n\nAccount ID: ${nearAddress}; Created: 2022-01-18; Last Updated: ${new Date().toISOString().split('T')[0]}; Transaction Count: 1556; Total USD Value: $63,547.60; DeFi Value: $36,091.58; NEAR Balance: $2,686.01; USDC Balance: $2,009.18; NEKO Balance: $22,635.27; Not a Bot; Probable Ethereum Address: 0x983ba06d3c13c73a9c47e70e14681fffd3731c8d; Top Interactions: Ref Finance, wrap.near; NFT Activity: Good Fortune Felines; Cross-Chain: Yes; Active in DeFi and NFT trading.`;

    console.log('Sending transaction with:', {
      requestId,
      nearAddress,
      summaryLength: mockShortSummary.length
    });

    await wallet.signAndSendTransaction({
      receiverId: CONTRACT_ID,
      actions: [{
        type: 'FunctionCall',
        params: {
          methodName: CONTRACT_METHODS.COMPLETE_INVESTIGATION,
          args: { 
            request_id: requestId,
            robust_summary: mockRobustSummary,
            short_summary: mockShortSummary
          },
          gas: DEFAULT_GAS,
          deposit: deposit
        }
      }]
    });

    console.log('Investigation completed, NFT minted for request:', requestId);
  } catch (error) {
    console.error('Error completing investigation:', error);
    throw error;
  }
}

export async function pollInvestigationStatus(requestId: string): Promise<InvestigationProgress> {
  const maxAttempts = 60; // 1 minute with 1-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkInvestigationStatus(requestId);
    if (status.stage === 'investigation-complete' || status.stage === 'error') {
      return status;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    attempts++;
  }

  throw new Error('Investigation timed out');
}

export type {
  InvestigationStage,
};
