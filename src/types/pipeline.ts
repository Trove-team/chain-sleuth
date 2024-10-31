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
  taskId: string;
  status: 'processing' | 'complete' | 'failed' | 'exists';
  existingData?: {
    robustSummary: string;
    shortSummary: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface StatusResponse {
  status: 'processing' | 'complete' | 'failed';
  data: {
    accountId: string;
    progress?: number;
    currentStep?: string;
    error?: string;
  };
}