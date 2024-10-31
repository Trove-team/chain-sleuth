export interface QueryResult {
  accountId: string;
  timestamp: string;
  status: 'Completed' | 'Processing' | 'Failed';
  financialSummary: {
    totalUsdValue: string;
    nearBalance: string;
    defiValue: string;
  };
  analysis: {
    transactionCount: number;
    isBot: boolean;
    robustSummary: string | null;
    shortSummary: string | null;
  };
}

export interface ProcessingResponse {
  status: 'processing' | 'complete' | 'failed' | 'error' | 'exists';
  message?: string;
  taskId?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  existingData?: {
    robustSummary: string;
    shortSummary: string;
  };
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
    totalUSDValue: string;
    balance: {
      items: Array<{
        symbol: string;
        amount: string;
      }>;
    };
    defi: {
      totalUSDValue: string;
    };
  };
  tx_count: number;
  bot_detection: {
    isPotentialBot: boolean;
  };
  robustSummary: string | null;
  shortSummary: string | null;
}