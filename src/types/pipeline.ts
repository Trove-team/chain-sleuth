export interface QueryResult {
  accountId: string;
  timestamp: string;
  status: string;
  financialSummary: {
    totalUsdValue: number;
    nearBalance: string;
    defiValue: number;
  };
  analysis: {
    transactionCount: number;
    isBot: boolean;
    robustSummary: string;
    shortSummary: string;
  };
}

export interface ProcessingResponse {
  taskId: string;
  status: 'processing' | 'complete' | 'failed' | 'error' | 'exists';
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  existingData?: {
    robustSummary: string;
    shortSummary: string;
  };
  data?: {
    robustSummary?: string;
    shortSummary?: string;
  };
  statusLink?: string;
}

export interface StatusResponse {
  status: 'processing' | 'complete' | 'failed';
  data: {
    accountId: string;
    progress?: number;
    currentStep?: string;
    error?: string;
    taskId?: string;
  };
}

export interface MetadataResponse {
  wealth: {
    totalUSDValue: number;
    balance: {
      items: Array<{
        symbol: string;
        amount: number | string;
      }>;
    };
    defi: {
      totalUSDValue: number;
    };
  };
  tx_count: number;
  bot_detection: {
    isPotentialBot: boolean;
  };
  robustSummary: string;
  shortSummary: string;
}