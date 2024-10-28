import { generateNeo4jToken } from './auth';

interface TokenResponse {
  token: string;
}

interface ProcessingResponse {
  status: string;
  message: string;
  data: {
    taskId: string;
    robustSummary?: string;
    shortSummary?: string;
    graphLink?: string;
    statusLink: string;
  };
}

interface StatusResponse {
  status: string;
  message: string;
  data: {
    status: string;
    currentStep: string;
    progress: number;
  };
}

interface SummaryResponse {
  status: string;
  message: string;
  data: {
    robustSummary: string;
    shortSummary: string;
    graphLink: string;
    accountId: string;
  };
}

interface MetadataResponse {
  status: string;
  message: string;
  data: {
    accountId: string;
    metadata: {
      last_updated: string;
      account_id: string;
      created: string;
      tx_count: number;
      wealth: {
        defi: { totalUSDValue: string };
        balance: {
          items: Array<{
            contract: string;
            amount: number;
            symbol: string;
            usdValue: string;
            tokenPrice: string;
          }>;
          totalUSDValue: string;
        };
        totalUSDValue: string;
      };
      bot_detection: {
        isPotentialBot: boolean;
      };
      account_type: {
        classification: string;
        sub_classification: string | null;
        name: string | null;
        dapp: string | null;
        type: string;
      };
      transaction_counts: {
        totalCount: number;
      };
      robustSummary: string | null;
      shortSummary: string | null;
    };
    status: string;
    taskId: string;
  };
}

export class Neo4jTestClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private jwt: string | null = null;

  constructor() {
    this.baseUrl = (process.env.NEO4J_API_URL || '').trim().replace(/\/$/, '');
    this.apiKey = process.env.NEO4J_API_KEY || '';

    if (!this.baseUrl) throw new Error('NEO4J_API_URL is not configured');
    if (!this.apiKey) throw new Error('NEO4J_API_KEY is not configured');

    console.log('Initialized with base URL:', this.baseUrl);
  }

  private async getJwtToken(): Promise<string> {
    if (this.jwt) return this.jwt;

    const url = `${this.baseUrl}/api/v1/auth/token`;
    console.log('Getting JWT token from:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to get JWT token: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
    }

    const data = await response.json() as TokenResponse;
    this.jwt = data.token;
    return this.jwt;
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const jwt = await this.getJwtToken();
    const url = `${this.baseUrl}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`Making request to: ${url}`);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        throw new Error(`Request failed: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
      }

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/health');
      return result.status === 'success';
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async initiateProcessing(accountId: string): Promise<ProcessingResponse> {
    console.log(`\n=== Initiating Processing for ${accountId} ===`);
    const response = await this.makeRequest('/account', {
      method: 'POST',
      body: JSON.stringify({ accountId })
    });

    // If account exists, return existing data
    if (response.status === 'exists') {
      console.log('Account already exists with data');
      return {
        status: 'exists',
        message: 'Account already processed',
        data: response.data
      };
    }

    return response;
  }

  async checkStatus(taskId: string): Promise<StatusResponse> {
    console.log(`\n=== Checking Status for Task ${taskId} ===`);
    const response = await this.makeRequest(`/status/${taskId}`);
    console.log('Status response:', JSON.stringify(response, null, 2));
    return response;
  }

  async getSummary(taskId: string): Promise<SummaryResponse> {
    console.log(`\n=== Getting Summary for Task ${taskId} ===`);
    return this.makeRequest(`/summary/${taskId}`);
  }

  async getMetadata(accountId: string): Promise<MetadataResponse> {
    console.log(`\n=== Getting Metadata for Account ${accountId} ===`);
    return this.makeRequest(`/metadata/${accountId}`);
  }

  async processAndWaitForCompletion(accountId: string, pollIntervalMs: number = 5000, timeoutMs: number = 300000): Promise<any> {
    // Start processing
    console.log(`Starting processing for account: ${accountId}`);
    const initResponse = await this.initiateProcessing(accountId);
    
    if (initResponse.status === 'exists') {
      console.log('Account exists, forcing reprocessing...');
      // If it exists, force a reprocess
      const reprocessResponse = await this.initiateProcessing(accountId);
      if (!reprocessResponse.data?.taskId) {
        throw new Error('Failed to start processing');
      }
    }

    const taskId = initResponse.data.taskId;
    console.log(`Got task ID: ${taskId}`);

    const startTime = Date.now();
    let lastProgress = -1;

    // Poll for completion
    while (true) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Processing timed out after ${timeoutMs/1000} seconds`);
      }

      const status = await this.checkStatus(taskId);
      
      // Only log if progress changed
      if (status.data?.progress !== lastProgress) {
        console.log(`Status: ${status.status}`);
        console.log(`Progress: ${status.data?.progress}%`);
        console.log(`Step: ${status.data?.currentStep}`);
        lastProgress = status.data?.progress;
      }

      if (status.status === 'complete' || status.status === 'completed') {
        // Get metadata which includes summaries
        const metadata = await this.getMetadata(accountId);
        
        // If summaries are null, wait a bit and try again
        if (!metadata.data.metadata.robustSummary) {
          console.log('Summaries not ready, waiting...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        return {
          accountId: metadata.data.accountId,
          status: metadata.data.status,
          metadata: metadata.data.metadata,
          summaries: {
            robustSummary: metadata.data.metadata.robustSummary,
            shortSummary: metadata.data.metadata.shortSummary
          },
          wealth: metadata.data.metadata.wealth,
          accountType: metadata.data.metadata.account_type,
          botDetection: metadata.data.metadata.bot_detection,
          transactionCounts: metadata.data.metadata.transaction_counts,
          taskId: taskId
        };
      } else if (status.status === 'failed') {
        throw new Error(`Processing failed: ${status.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }
}
