use std::prelude::v1::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, json_types::U64, env};
use crate::webhook_mappings::WebhookType;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub enum InvestigationStatus {
    Pending,
    Processing,
    Completed,
    Failed
}

// Add From implementation for WebhookType
impl From<WebhookType> for InvestigationStatus {
    fn from(webhook_type: WebhookType) -> Self {
        match webhook_type {
            WebhookType::Progress => InvestigationStatus::Processing,
            WebhookType::Completion => InvestigationStatus::Completed,
            WebhookType::Error => InvestigationStatus::Failed,
            _ => InvestigationStatus::Processing,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct AnalysisSummary {
    pub robust_summary: Option<String>,
    pub short_summary: Option<String>,
    pub transaction_count: u64,
    pub is_bot: bool,
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
pub struct InvestigationMetadata {
    pub case_number: u64,
    pub target_account: AccountId,
    pub requester: AccountId,
    pub investigation_date: U64,
    pub status: InvestigationStatus,
    pub summary: Option<String>,         // Combined summary
    pub transaction_count: u64,
    pub total_value_usd: String,
    pub near_balance: String,            // Keep NEAR balance separate
    pub is_bot: bool,                    // Keep bot detection
    pub last_updated: U64,              // For frontend compatibility
}

impl InvestigationMetadata {
    pub fn new(
        case_number: u64,
        target_account: AccountId,
        requester: AccountId,
    ) -> Self {
        Self {
            case_number,
            target_account,
            requester,
            investigation_date: U64(env::block_timestamp()),
            last_updated: U64(env::block_timestamp()),
            status: InvestigationStatus::Pending,
            summary: None,
            transaction_count: 0,
            total_value_usd: "0".to_string(),
            near_balance: "0".to_string(),
            is_bot: false,
        }
    }

    pub fn update_from_webhook(&mut self, webhook_data: &serde_json::Value) {
        // Update status
        if let Some(status) = webhook_data.get("status").and_then(|v| v.as_str()) {
            self.status = match status {
                "complete" => InvestigationStatus::Completed,
                "processing" => InvestigationStatus::Processing,
                "failed" => InvestigationStatus::Failed,
                _ => self.status.clone(),
            };
        }

        if let Some(result) = webhook_data.get("result") {
            // Update financial data
            if let Some(financial) = result.get("financialData") {
                if let Some(total_usd) = financial.get("totalUsdValue").and_then(|v| v.as_str()) {
                    self.total_value_usd = total_usd.to_string();
                }
                if let Some(near_balance) = financial.get("nearBalance").and_then(|v| v.as_str()) {
                    self.near_balance = near_balance.to_string();
                }
            }

            // Update analysis data
            if let Some(robust) = result.get("robustSummary").and_then(|v| v.as_str()) {
                self.summary = Some(robust.to_string());
            } else if let Some(short) = result.get("shortSummary").and_then(|v| v.as_str()) {
                self.summary = Some(short.to_string());
            }
            if let Some(count) = result.get("transactionCount").and_then(|v| v.as_u64()) {
                self.transaction_count = count;
            }
            if let Some(is_bot) = result.get("isBot").and_then(|v| v.as_bool()) {
                self.is_bot = is_bot;
            }
        }

        self.last_updated = U64(env::block_timestamp());
    }
}