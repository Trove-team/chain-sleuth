// src/app/api/pipeline/investigate/route.ts

import { NextResponse } from 'next/server';
import { Contract, connect, Account } from 'near-api-js';  // Added Account import
import { Redis } from 'ioredis';
import { PipelineService } from '@/services/pipelineService';
import { createLogger } from '@/utils/logger';  // Add logger if you want error logging

const pipelineService = new PipelineService();
const redis = new Redis(process.env.REDIS_URL || '');
const logger = createLogger('pipeline-route');

// Add type for contract methods
interface InvestigationContract {
    start_investigation: (args: {
        args: {
            target_account: string;
        };
        gas: string;
    }) => Promise<{ taskId: string }>;
    update_investigation_metadata: (args: {
        args: {
            task_id: string;
            metadata_update: {
                description?: string;
                extra?: string;
            };
        };
        gas: string;
    }) => Promise<void>;
}

// Add type for ProcessingResponse from PipelineService
interface ProcessingResponse {
    taskId: string;
    statusLink: string;
    existingData?: {
        robustSummary: string;
        shortSummary: string;
    };
}

export async function POST(request: Request) {
    try {
        const { accountId } = await request.json() as { accountId: string };
        
        // Get token for API calls
        const token = await pipelineService.getToken();

        // Start the investigation on NEAR contract first
        const near = await connect({
            networkId: process.env.NEAR_NETWORK_ID!,
            nodeUrl: `https://rpc.${process.env.NEAR_NETWORK_ID}.near.org`
        });
        
        const nearAccount = await near.account(process.env.NEAR_CONTRACT_ID!);
        const contract = new Contract(
            nearAccount,
            process.env.NEAR_CONTRACT_ID!,
            {
                viewMethods: ['nft_token'],
                changeMethods: ['start_investigation'],
                useLocalViewExecution: false // or true, depending on your requirement
            }
        ) as unknown as InvestigationContract;

        // This will mint placeholder NFT and return taskId
        const { taskId } = await contract.start_investigation({
            args: { target_account: accountId },
            gas: '300000000000000'
        });

        // Start pipeline processing
        const processingResponse = await pipelineService.startProcessing(accountId, token);
        
        // Store initial state in Redis
        await redis.hset(`task:${taskId}`, {
            status: 'processing',
            accountId,
            progress: 0,
            startedAt: Date.now().toString() // Convert to string for Redis
        });

        return NextResponse.json({
            success: true,
            taskId: taskId,
            statusLink: `/api/pipeline/status/${taskId}`
        });

    } catch (error) {
        logger.error('Investigation start failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: 'Failed to start investigation' },
            { status: 500 }
        );
    }
}
