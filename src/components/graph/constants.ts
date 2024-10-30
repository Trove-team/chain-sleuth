import { NodeType } from '@/types/graph';

export const NODE_R = 25; // Increased from 8 to 25 for bigger nodes
export const LABEL_THRESHOLD = 1.5; // Only show labels above this zoom level

export const NODE_COLORS: Record<NodeType, string> = {
  Account: '#4299E1',
  Transaction: '#48BB78',
  Contract: '#ED64A6'
};

// Add border color
export const NODE_BORDER_COLOR = '#2B6CB0'; // Darker blue for outline