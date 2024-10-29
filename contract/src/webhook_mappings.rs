use std::prelude::v1::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub enum WebhookType {
    Progress,
    Completion,
    Error,
    MetadataReady,
    Log
}

impl WebhookType {
    pub fn is_terminal(&self) -> bool {
        matches!(self, WebhookType::Completion | WebhookType::Error)
    }

    pub fn requires_metadata_update(&self) -> bool {
        matches!(
            self,
            WebhookType::Completion | WebhookType::MetadataReady | WebhookType::Progress
        )
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            WebhookType::Progress => "progress",
            WebhookType::Completion => "completion",
            WebhookType::Error => "error",
            WebhookType::MetadataReady => "metadata_ready",
            WebhookType::Log => "log",
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct WebhookResponse {
    pub success: bool,
    pub message: Option<String>,
}

impl WebhookResponse {
    pub fn success() -> Self {
        Self {
            success: true,
            message: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            message: Some(message),
        }
    }
}