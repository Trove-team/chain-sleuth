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
        logger.info('Received webhook', webhook);
        
        await workflow.handleWebhookUpdate(webhook.data.taskId, webhook);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Webhook processing failed:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
