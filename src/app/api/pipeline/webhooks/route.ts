// src/app/api/pipeline/webhooks/route.ts

import { NextResponse } from 'next/server';
import { connect } from 'near-api-js';
import { PipelineService } from '@/services/pipelineService';
import { createLogger } from '@/utils/logger';
import { initInvestigationContract, formatNFTMetadata } from '@/constants/contract';

const logger = createLogger('webhook-handler');
const pipelineService = new PipelineService();

interface WebhookData {
    taskId: string;
    accountId: string;
    status: 'processing' | 'complete' | 'failed';
    progress?: number;
    currentStep?: string;
    robustSummary?: string;
    shortSummary?: string;
    metadata?: any;
}

export async function POST(request: Request) {
    try {
        const webhookData: WebhookData = await request.json();
        
        logger.info('Received webhook', {
            status: webhookData.status,
            accountId: webhookData.accountId,
            taskId: webhookData.taskId,
            progress: webhookData.progress
        });

        if (webhookData.status === 'complete') {
            // Get fresh token for API calls
            const token = await pipelineService.getToken();

            // Get full metadata and summaries
            const [metadata, summaries] = await Promise.all([
                pipelineService.getMetadata(webhookData.accountId, token),
                pipelineService.getSummaries(webhookData.accountId, token)
            ]);

            // Update contract with final data
            await updateContractWithResults(
                webhookData.taskId, 
                webhookData.accountId,
                metadata,
                summaries
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Webhook processing failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function updateContractWithResults(
    taskId: string, 
    accountId: string,
    metadata: any,
    summaries: { robustSummary: string | null; shortSummary: string | null; }
) {
    try {
        const near = await connect({
            networkId: process.env.NEAR_NETWORK_ID!,
            nodeUrl: `https://rpc.${process.env.NEAR_NETWORK_ID}.near.org`
        });
        
        const account = await near.account(process.env.NEAR_CONTRACT_ID!);
        const contract = initInvestigationContract(account);

        const formattedMetadata = formatNFTMetadata(metadata, summaries);

        await contract.update_investigation_metadata({
            args: {
                task_id: taskId,
                metadata_update: {
                    description: formattedMetadata.description,
                    extra: JSON.stringify(formattedMetadata.extra)
                }
            },
            gas: '300000000000000'
        });

        logger.info('Contract metadata updated', {
            taskId,
            accountId
        });
    } catch (error) {
        logger.error('Contract update failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            taskId,
            accountId
        });
        throw error;
    }
}