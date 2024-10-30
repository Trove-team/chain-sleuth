// src/services/investigationWorkflow.ts
import { connect } from "near-api-js";
import { parseNearAmount } from 'near-api-js/lib/utils/format';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { CONTRACT_ID, NETWORK_ID } from '../constants/contract';
import { PipelineService } from './pipelineService';
import { createLogger } from '@/utils/logger';
import { initInvestigationContract } from '@/constants/contract';
import { WebhookData } from '@/types/investigation';
import { WebhookType } from '@/types/webhook';

const logger = createLogger('investigation-workflow');

export interface WorkflowState {
  requestId: string;
  targetAccount: string;
  stage: 'CONTRACT_REQUEST' | 'ANALYSIS' | 'COMPLETION';
  analysisTaskId?: string;
  startTime: number;
  lastUpdated: number;
  attempts: number;
  analysisResult?: any;
  error?: string;
}

export class InvestigationWorkflow {
  private readonly redis: Redis;
  private readonly pipelineService: PipelineService;
  private readonly MAX_ATTEMPTS = 3;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || '');
    this.pipelineService = new PipelineService();
  }

  async startInvestigation(targetAccount: string, deposit: string): Promise<WorkflowState> {
    const requestId = uuidv4();
    const state: WorkflowState = {
      requestId,
      targetAccount,
      stage: 'CONTRACT_REQUEST',
      startTime: Date.now(),
      lastUpdated: Date.now(),
      attempts: 0
    };

    await this.saveWorkflowState(state);
    return state;
  }

  async processAnalysis(state: WorkflowState) {
    try {
      // Get token for Neo4j API
      const token = await this.pipelineService.getToken();
      
      // Start analysis
      const { taskId } = await this.pipelineService.startProcessing(
        state.targetAccount, 
        token
      );

      state.analysisTaskId = taskId;
      state.stage = 'ANALYSIS';
      await this.saveWorkflowState(state);

      return taskId;
    } catch (error) {
      state.attempts++;
      state.error = error instanceof Error ? error.message : String(error);
      await this.saveWorkflowState(state);
      throw error;
    }
  }

  async handleWebhookUpdate(taskId: string, data: WebhookData): Promise<void> {
    const metadata = await this.prepareMetadataUpdate(data);
    await this.updateContractMetadata(data.data.requestId, data.data.accountId, metadata);
}

  private async prepareMetadataUpdate(data: WebhookData): Promise<{
    description: string;
    extra: string;
    webhookType: WebhookType;
  }> {
    const baseMetadata = {
        case_number: parseInt(data.data.requestId.split('#')[1], 10),
        target_account: data.data.accountId,
        requester: data.data.accountId,
        investigation_date: data.data.timestamp,
        last_updated: new Date().toISOString(),
        status: data.status === 'complete' ? 'Completed' 
             : data.status === 'processing' ? 'Processing'
             : 'Failed'
    };

    const defaultFinancialSummary = {
        total_usd_value: "0",
        near_balance: "0",
        defi_value: "0"
    };

    const defaultAnalysisSummary = {
        robust_summary: null,
        short_summary: null,
        transaction_count: 0,
        is_bot: false
    };

    switch (data.type.toLowerCase()) {
        case 'progress':
            return {
                description: data.data.message || "Processing...",
                extra: JSON.stringify({
                    ...baseMetadata,
                    financial_summary: defaultFinancialSummary,
                    analysis_summary: {
                        ...defaultAnalysisSummary,
                        transaction_count: data.data.result?.transactionCount || 0
                    }
                }),
                webhookType: 'Progress'
            };

        case 'completion':
            return {
                description: data.data.result?.shortSummary || "Investigation complete",
                extra: JSON.stringify({
                    ...baseMetadata,
                    financial_summary: {
                        total_usd_value: data.data.result?.financialData?.totalUsdValue || "0",
                        near_balance: data.data.result?.financialData?.nearBalance || "0",
                        defi_value: data.data.result?.financialData?.defiValue || "0"
                    },
                    analysis_summary: {
                        robust_summary: data.data.result?.robustSummary || null,
                        short_summary: data.data.result?.shortSummary || null,
                        transaction_count: data.data.result?.transactionCount || 0,
                        is_bot: data.data.result?.isBot || false
                    }
                }),
                webhookType: 'Completion'
            };

        case 'error':
            return {
                description: data.data.error || "Investigation failed",
                extra: JSON.stringify({
                    ...baseMetadata,
                    financial_summary: defaultFinancialSummary,
                    analysis_summary: defaultAnalysisSummary,
                    error: data.data.error
                }),
                webhookType: 'Error'
            };

        default:
            throw new Error(`Unsupported webhook type: ${data.type}`);
    }
  }

  private async updateContractMetadata(
    tokenId: string,
    accountId: string,
    data: {
      description: string;
      extra: string;
      webhookType: 'Progress' | 'Completion' | 'Error' | 'MetadataReady' | 'Log';
    }
  ) {
    // Your existing updateContractMetadata implementation
    const near = await connect({
      networkId: process.env.NEAR_NETWORK_ID!,
      nodeUrl: `https://rpc.${process.env.NEAR_NETWORK_ID}.near.org`
    });
    
    const account = await near.account(process.env.NEAR_CONTRACT_ID!);
    const contract = initInvestigationContract(account);

    await contract.update_investigation_metadata({
      args: {
        token_id: tokenId,
        metadata_update: {
          description: data.description,
          extra: data.extra
        },
        webhook_type: data.webhookType
      },
      gas: '300000000000000'
    });
  }

  async getStatus(requestId: string): Promise<WorkflowState | null> {
    return this.getWorkflowState(requestId);
  }

  private async saveWorkflowState(state: WorkflowState) {
    state.lastUpdated = Date.now();
    await this.redis.hset(
      `workflow:${state.requestId}`, 
      'state', 
      JSON.stringify(state)
    );
  }

  private async getWorkflowState(requestId: string): Promise<WorkflowState | null> {
    const data = await this.redis.hget(`workflow:${requestId}`, 'state');
    return data ? JSON.parse(data) : null;
  }

  private async findStateByTaskId(taskId: string): Promise<WorkflowState | null> {
    // Implementation to find state by taskId in Redis
    // You might want to maintain a separate index for this
    const keys = await this.redis.keys('workflow:*');
    for (const key of keys) {
      const state = await this.getWorkflowState(key.split(':')[1]);
      if (state?.analysisTaskId === taskId) return state;
    }
    return null;
  }

  public async getStateByTaskId(taskId: string): Promise<WorkflowState | null> {
    try {
        const state = await this.getWorkflowState(taskId);
        return state;
    } catch (error) {
        logger.error('Failed to get workflow state', {
            taskId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
    }
  }
}