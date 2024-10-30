use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::json_types::U64;
use std::prelude::v1::*;

/// Events emitted by the investigation contract
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
    },
    // Add new event types
    StatusChanged {
        token_id: String,
        old_status: String,
        new_status: String,
        timestamp: U64,
    },
    AnalysisCompleted {
        token_id: String,
        timestamp: U64,
        has_summary: bool,
    },
    ContractInitialized {
        owner_id: String,
        timestamp: U64,
        version: String,
        block_height: u64,
    },
    ContractMigrated {
        old_version: u32,
        new_version: u32,
        timestamp: U64,
    },
    StorageError {
        operation: String,
        error: String,
        timestamp: U64,
    },
    DeserializationError {
        context: String,
        error: String,
        timestamp: U64,
    }
}

impl InvestigationEvent {
    pub fn log(&self) {
        near_sdk::env::log_str(&format!("EVENT_JSON:{}", near_sdk::serde_json::to_string(self).unwrap()));
    }
}

// Standard NFT events
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct NftMintLog {
    pub owner_id: String,
    pub token_ids: Vec<String>,
    pub memo: Option<String>,
}

impl NftMintLog {
    pub fn log(&self) {
        near_sdk::env::log_str(&format!("NFT_MINT:{}", near_sdk::serde_json::to_string(self).unwrap()));
    }
}