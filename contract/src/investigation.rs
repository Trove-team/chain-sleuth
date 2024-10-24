use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, json_types::U64};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct InvestigationRequest {
    pub requester: AccountId,
    pub target_account: AccountId,
    pub timestamp: U64,
    pub status: InvestigationStatus,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub enum InvestigationStatus {
    Pending,
    Processing,
    Completed,
    Failed
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct InvestigationData {
    pub subject_account: AccountId,
    pub investigator: AccountId,
    pub creation_date: u64,
    pub last_updated: u64,
    pub transaction_count: u64,
    pub total_usd_value: f64,
    pub defi_value: Option<f64>,
    pub near_balance: Option<f64>,
    pub reputation_score: Option<u32>,
    pub eth_address: Option<String>,
    pub summary: String,
}