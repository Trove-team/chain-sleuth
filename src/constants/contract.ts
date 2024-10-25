// src/constants/contract.ts

export const CONTRACT_ID: string = process.env.NEXT_PUBLIC_CONTRACT_ID || 'chainsleuth2.testnet';

// Verify contract ID is set
if (!CONTRACT_ID) {
  console.error('WARNING: NEXT_PUBLIC_CONTRACT_ID is not set, using default contract ID');
}

// Define method names as string array instead of readonly tuple
export const DEFAULT_METHOD_NAMES: string[] = [
  'request_investigation',
  'complete_investigation',
  'get_investigation_status'
];

// For debugging
console.log('Using Contract ID:', CONTRACT_ID);