// src/services/investigationWorkflow.ts

import { connect } from "near-api-js";
import { parseNearAmount } from 'near-api-js/lib/utils/format';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { CONTRACT_ID, NETWORK_ID } from '../constants/contract';
import { makeNeo4jRequest } from '../utils/auth';

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

export interface WorkflowResult {
  status: 'success' | 'error' | 'pending';
  requestId: string;
  analysisTaskId?: string;
  tokenId?: string;
  error?: string;
  analysisResult?: any;
  nftMetadata?: any;
  stage?: string;
  progress?: number;
}

export class InvestigationWorkflow {
  private readonly redis: Redis;
  private readonly MAX_ATTEMPTS = 3;
  private readonly ANALYSIS_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || '');
  }

  async executeFullInvestigation(targetAccount: string, deposit: string): Promise<WorkflowResult> {
    const requestId = uuidv4();
    const state: WorkflowState = {
      requestId,
      targetAccount,
      stage: 'CONTRACT_REQUEST',
      startTime: Date.now(),
      lastUpdated: Date.now(),
      attempts: 0
    };

    try {
      // Start contract request
      const contractResult = await this.handleContractRequest(state, deposit);
      state.stage = 'ANALYSIS';
      await this.saveWorkflowState(state);

      // Start analysis using the new method
      const analysis = await makeNeo4jRequest('/v1/analyze', {
        method: 'POST',
        body: JSON.stringify({ accountId: targetAccount })
      });

      const { taskId } = analysis;
      state.analysisTaskId = taskId;
      await this.saveWorkflowState(state);

      // Wait for analysis completion
      const analysisResult = await this.waitForAnalysis(taskId);
      state.stage = 'COMPLETION';
      state.analysisResult = analysisResult;
      await this.saveWorkflowState(state);

      // Complete investigation
      const completionResult = await this.handleCompletion(state);
      await this.cleanupWorkflowState(state.requestId);

      return {
        status: 'success',
        requestId: state.requestId,
        analysisTaskId: state.analysisTaskId,
        tokenId: completionResult.token_id,
        analysisResult,
        nftMetadata: completionResult.metadata
      };

    } catch (error) {
      state.attempts++;
      state.error = error instanceof Error ? error.message : String(error);
      await this.saveWorkflowState(state);
      
      throw error;
    }
  }

  async getInvestigationStatus(requestId: string): Promise<WorkflowResult> {
    const state = await this.getWorkflowState(requestId);
    if (!state) {
      throw new Error('Investigation not found');
    }

    return {
      status: state.error ? 'error' : 'pending',
      requestId: state.requestId,
      analysisTaskId: state.analysisTaskId,
      stage: state.stage,
      error: state.error,
      analysisResult: state.analysisResult
    };
  }

  private async handleContractRequest(state: WorkflowState, deposit: string) {
    const near = await connect({
      networkId: NETWORK_ID,
      nodeUrl: `https://rpc.${NETWORK_ID}.near.org`
    });
    const account = await near.account(CONTRACT_ID);
    
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'request_investigation',
      args: { target_account: state.targetAccount },
      gas: BigInt('300000000000000'),
      attachedDeposit: BigInt(parseNearAmount(deposit) || '0')
    });

    return this.parseContractResponse(result);
  }

  private async handleAnalysis(state: WorkflowState) {
    state.analysisTaskId = uuidv4();
    await this.saveWorkflowState(state);

    // Call Neo4j analysis
    const response = await fetch(`${process.env.NEO4J_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEO4J_API_KEY}`
      },
      body: JSON.stringify({ accountId: state.targetAccount })
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return response.json();
  }

  private async handleCompletion(state: WorkflowState) {
    const near = await connect({
      networkId: NETWORK_ID,
      nodeUrl: `https://rpc.${NETWORK_ID}.near.org`
    });
    const account = await near.account(CONTRACT_ID);
    
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'complete_investigation',
      args: {
        request_id: state.requestId,
        robust_summary: state.analysisResult.robust_summary,
        short_summary: state.analysisResult.short_summary
      },
      gas: BigInt('300000000000000'),
      attachedDeposit: BigInt('50000000000000000000000')
    });

    return this.parseContractResponse(result);
  }

  private async saveWorkflowState(state: WorkflowState) {
    state.lastUpdated = Date.now();
    await this.redis.hset(`workflow:${state.requestId}`, state);
  }

  private async getWorkflowState(requestId: string): Promise<WorkflowState | null> {
    const state = await this.redis.hgetall(`workflow:${requestId}`);
    if (Object.keys(state).length === 0) return null;

    return Object.fromEntries(
      Object.entries(state).map(([k, v]) => [k, JSON.parse(v)])
    ) as WorkflowState;
  }

  private async cleanupWorkflowState(requestId: string) {
    await this.redis.del(`workflow:${requestId}`);
  }

  private parseContractResponse(result: any): any {
    return JSON.parse(Buffer.from(result.status.SuccessValue, 'base64').toString());
  }

  private async waitForAnalysis(taskId: string) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await makeNeo4jRequest(`/v1/status/${taskId}`);
        
        if (status.status === 'complete') {
          return status;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        // Continue trying if it's just a temporary error
      }
    }
    throw new Error('Analysis timeout');
  }
}
