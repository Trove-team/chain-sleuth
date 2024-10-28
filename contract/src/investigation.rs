use std::prelude::v1::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, json_types::U64, env};

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub enum InvestigationStatus {
    Pending,     // Initial placeholder NFT minted
    Processing,  // Analysis in progress
    Completed,   // Full metadata updated
    Failed       // Error occurred
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct InvestigationMetadata {
    pub case_number: u64,
    pub target_account: AccountId,
    pub requester: AccountId,
    pub investigation_date: U64,
    pub last_updated: U64,
    pub status: InvestigationStatus,
    pub financial_summary: FinancialSummary,
    pub analysis_summary: AnalysisSummary,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct FinancialSummary {
    pub total_usd_value: String,
    pub near_balance: String,
    pub defi_value: String,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct AnalysisSummary {
    pub robust_summary: Option<String>,
    pub short_summary: Option<String>,
    pub transaction_count: u64,
    pub is_bot: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct InvestigationResponse {
    pub request_id: String,
    pub status: InvestigationStatus,
    pub message: Option<String>,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct MetadataUpdate {
    pub description: Option<String>,
    pub extra: String,
}

// Convert webhook data to contract metadata
impl InvestigationMetadata {
    pub fn from_webhook_data(
        case_number: u64,
        target_account: AccountId,
        requester: AccountId,
        _webhook_data: &serde_json::Value  // Added underscore to indicate unused parameter
    ) -> Self {
        InvestigationMetadata {
            case_number,
            target_account,
            requester,
            investigation_date: U64(env::block_timestamp()),
            last_updated: U64(env::block_timestamp()),
            status: InvestigationStatus::Pending,
            financial_summary: FinancialSummary {
                total_usd_value: "0".to_string(),
                near_balance: "0".to_string(),
                defi_value: "0".to_string(),
            },
            analysis_summary: AnalysisSummary {
                robust_summary: None,
                short_summary: None,
                transaction_count: 0,
                is_bot: false,
            },
        }
    }
}
