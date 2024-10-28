use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::json_types::U64;
use std::prelude::v1::*;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub enum InvestigationEvent {
    Started {
        target_account: String,
        token_id: String,
        case_number: u64,
        timestamp: U64,
    },
    MetadataUpdated {
        token_id: String,
        timestamp: U64,
    },
    RetryAttempted {
        token_id: String,
        attempt: u32,
        timestamp: U64,
    },
    Failed {
        token_id: String,
        error: String,
        timestamp: U64,
    }
}

impl InvestigationEvent {
    pub fn log(&self) {
        near_sdk::env::log_str(&near_sdk::serde_json::to_string(self).unwrap());
    }
}

// Keep original NFTMintLog for standard NFT events
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct NftMintLog {
    pub owner_id: String,
    pub token_ids: Vec<String>,
    pub memo: Option<String>,
}

impl NftMintLog {
    pub fn log(&self) {
        near_sdk::env::log_str(&near_sdk::serde_json::to_string(self).unwrap());
    }
}
