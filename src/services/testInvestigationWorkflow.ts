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
  const response = await fetch('/api/near-contract/test-investigation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queried_name: address }),
  });

  if (!response.ok) {
    throw new Error('Failed to start investigation');
  }

  const { requestId } = await response.json();
  return requestId;
}

export async function checkInvestigationStatus(requestId: string): Promise<InvestigationProgress> {
  // Simulate different stages based on time elapsed
  const response = await fetch(`/api/near-contract/test-investigation/status?requestId=${requestId}`);
  
  if (!response.ok) {
    throw new Error('Failed to check investigation status');
  }

  return response.json();
}

export async function completeInvestigation(requestId: string): Promise<void> {
  const response = await fetch('/api/near-contract/test-investigation/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId }),
  });

  if (!response.ok) {
    throw new Error('Failed to complete investigation');
  }
}
