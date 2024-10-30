import { NodeType } from '@/types/graph';

export const NODE_R = 8; // Increase base node size
export const LABEL_THRESHOLD = 1.5; // Only show labels above this zoom level

export const NODE_COLORS: Record<NodeType, string> = {
  Account: '#4299E1',
  Transaction: '#48BB78',
  Contract: '#ED64A6'
};