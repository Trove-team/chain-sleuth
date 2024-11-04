import { MetadataResponse } from "./pipeline";
import { WebhookType } from "./webhook";

export interface WebSocketMessage {
    type: WebhookType;
    taskId: string;
    data: {
        progress?: number;
        metadata?: MetadataResponse;
        error?: string;
        accountId: string;
        currentStep?: string;
    };
}

export interface WebSocketStatus {
    connected: boolean;
    error?: string;
    lastMessage?: WebSocketMessage;
}