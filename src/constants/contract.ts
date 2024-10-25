// src/constants/contract.ts

export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;
if (!CONTRACT_ID) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ID environment variable is not set');
}

export const DEFAULT_METHOD_NAMES = [
  'request_investigation',
  'complete_investigation',
  'get_investigation_status'
] as const;

// Add some logging to help debug
console.log('Contract ID from env:', CONTRACT_ID);