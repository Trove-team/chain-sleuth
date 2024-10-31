// Add this new file
export interface ProcessingResponse {
    taskId: string;
    status: 'processing' | 'complete' | 'failed';
    existingData?: {
      robustSummary?: string;
      shortSummary?: string;
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