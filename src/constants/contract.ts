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

// Contract method names as a const object for better TypeScript support
export const CONTRACT_METHODS = {
  REQUEST_INVESTIGATION: 'request_investigation',
  COMPLETE_INVESTIGATION: 'complete_investigation',
  GET_INVESTIGATION_STATUS: 'get_investigation_status'
} as const;

// Legacy array for backward compatibility if needed
export const DEFAULT_METHOD_NAMES: string[] = Object.values(CONTRACT_METHODS);

// Gas configuration
export const DEFAULT_GAS = '300000000000000'; // 300 TGas
export const MAX_GAS = '300000000000000';

// Deposit configuration (in yoctoNEAR)
export const DEFAULT_DEPOSIT = '1000000000000000000000000'; // 1 NEAR
export const COMPLETE_INVESTIGATION_DEPOSIT = '50000000000000000000000'; // 0.05 NEAR
export const MIN_DEPOSIT = '10000000000000000000000';    // 0.01 NEAR

// Investigation configuration
export const POLLING_INTERVAL = 3000; // 3 seconds
export const MAX_POLLING_ATTEMPTS = 20;

// Default transaction configuration
export const DEFAULT_FUNCTION_CALL_CONFIG = {
  gas: DEFAULT_GAS,
  attachedDeposit: DEFAULT_DEPOSIT,
} as const;

// For debugging
console.log('[CONTRACT] Exported CONTRACT_ID:', CONTRACT_ID);
console.log('[CONTRACT] Available methods:', DEFAULT_METHOD_NAMES);
