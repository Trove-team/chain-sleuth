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
  status: 'processing' | 'complete' | 'failed' | 'exists';
  statusLink?: string;
  taskId?: string;
  data?: {
    progress?: number;
    metadata?: MetadataResponse;
  };
}

export interface StatusResponse {
  status: 'processing' | 'complete' | 'failed' | 'exists';
  data: {
    accountId: string;
    progress?: number;
    currentStep?: string;
    error?: string;
    taskId?: string;
    metadata?: MetadataResponse;
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
  robustSummary?: string;
  shortSummary?: string;
}