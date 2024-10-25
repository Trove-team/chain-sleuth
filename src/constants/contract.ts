// src/constants/contract.ts

const getContractId = () => {
  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;
  console.log('[CONTRACT] Loading contract ID from env:', contractId);
  
  if (!contractId) {
    console.warn('[CONTRACT] No contract ID found in env, using default');
    return 'chainsleuth2.testnet';
  }
  
  return contractId;
};

export const CONTRACT_ID = getContractId();

export const DEFAULT_METHOD_NAMES: string[] = [
  'request_investigation',
  'complete_investigation',
  'get_investigation_status'
];

// For debugging
console.log('[CONTRACT] Exported CONTRACT_ID:', CONTRACT_ID);