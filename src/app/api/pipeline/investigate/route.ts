// src/app/api/pipeline/investigate/route.ts

import { NextResponse } from 'next/server';
import { connect } from 'near-api-js';  // Simplified import
import { Redis } from 'ioredis';
import { PipelineService } from '@/services/pipelineService';
import { createLogger } from '@/utils/logger';
import { 
    initInvestigationContract, 
    InvestigationContract,  // Import the interface
    CONTRACT_METHODS 
} from '@/constants/contract';

const pipelineService = new PipelineService();
const redis = new Redis(process.env.REDIS_URL || '');
const logger = createLogger('pipeline-route');

// Only keep the ProcessingResponse interface
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
        const token = await pipelineService.getToken();

        const near = await connect({
            networkId: process.env.NEAR_NETWORK_ID!,
            nodeUrl: `https://rpc.${process.env.NEAR_NETWORK_ID}.near.org`
        });
        
        const nearAccount = await near.account(process.env.NEAR_CONTRACT_ID!);
        const contract = initInvestigationContract(nearAccount);

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
