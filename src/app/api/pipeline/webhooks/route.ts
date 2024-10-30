// src/app/api/pipeline/webhooks/route.ts

import { NextResponse } from 'next/server';
import { createLogger } from '@/utils/logger';
import { InvestigationWorkflow } from '@/services/investigationWorkflow';
import type { WebhookData } from '@/types/investigation';

const logger = createLogger('webhook-handler');
const workflow = new InvestigationWorkflow();

export async function POST(request: Request) {
    try {
        const webhook: WebhookData = await request.json();
        
        // Validate webhook structure
        if (!webhook.type || !webhook.data?.taskId || !webhook.data?.accountId) {
            return NextResponse.json(
                { error: 'Invalid webhook format' },
                { status: 400 }
            );
        }

        logger.info('Received webhook', {
            type: webhook.type,
            taskId: webhook.data.taskId,
            accountId: webhook.data.accountId
        });
        
        await workflow.handleWebhookUpdate(webhook.data.taskId, webhook);
        
        return NextResponse.json({ 
            success: true,
            message: `Successfully processed ${webhook.type} webhook`
        });
    } catch (error) {
        logger.error('Webhook processing failed:', error);
        return NextResponse.json(
            { 
                error: 'Webhook processing failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
