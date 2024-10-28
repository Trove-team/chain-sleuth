use std::prelude::v1::*;
use crate::*;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub enum WebhookType {
    Progress,
    Completion,
    Error,
    MetadataReady,
    Log
}

impl From<WebhookType> for InvestigationStatus {
    fn from(webhook_type: WebhookType) -> Self {
        match webhook_type {
            WebhookType::Progress => InvestigationStatus::Processing,
            WebhookType::Completion => InvestigationStatus::Completed,
            WebhookType::Error => InvestigationStatus::Failed,
            WebhookType::MetadataReady => InvestigationStatus::Processing,
            WebhookType::Log => InvestigationStatus::Processing,
        }
    }
}
