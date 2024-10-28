/**
 * Webhook types that match the smart contract's WebhookType enum
 * @see contract/src/webhook_mappings.rs
 */
export type WebhookType = 'Progress' | 'Completion' | 'Error' | 'MetadataReady' | 'Log';