// src/services/testInvestigationWorkflow.ts

export type InvestigationStage = 
  | 'requesting'
  | 'wallet-signing'
  | 'investigation-started'
  | 'investigation-in-progress'
  | 'investigation-complete'
  | 'minting'
  | 'complete'
  | 'error'
  | 'existing';  // Added this new stage

export interface InvestigationProgress {
  stage: InvestigationStage;
  message: string;
  requestId?: string;
  data?: any;
}

export async function requestInvestigation(address: string): Promise<string> {
  console.log('Requesting investigation for address:', address);
  try {
    const response = await fetch('/api/near-contract/test-investigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queried_name: address }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start investigation: ${response.statusText}`);
    }

    const { requestId } = await response.json();
    return requestId;
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

export async function completeInvestigation(requestId: string, deposit: string): Promise<void> {
  const mockNeo4jResponse = `
    **Neo4j-Friendly Metadata Summary:**
    Account ID: ${requestId.split(':')[1]};
    Created: 2023-01-01;
    Last Updated: ${new Date().toISOString()};
    Transaction Count: 1,234;
    Total USD Value: $10,000.00;
    DeFi Value: $5,000.00;
    NEAR Balance: 100.5;
    USDC Balance: 1000.00;
    NEKO Balance: 500.00;
    Not a Bot: true;
    Probable Ethereum Address: 0x1234...5678;
    Top Interactions: account1.near, account2.near;
    NFT Activity: Minted 2, Transferred 1;
    Cross-Chain: Ethereum Bridge used;
    Trading Activity: High volume on Ref Finance
  `;

  const response = await fetch('/api/near-contract/test-investigation/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      requestId,
      robust_summary: "This is a detailed analysis of the account...",
      short_summary: mockNeo4jResponse,
      deposit
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to complete investigation');
  }

  const result = await response.json();
  console.log('Investigation completed, NFT minted:', result);
}
