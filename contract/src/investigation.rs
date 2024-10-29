use std::prelude::v1::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, json_types::U64, env};
use crate::webhook_mappings::WebhookType;  // Add this import

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

// Enhance the implementation
impl InvestigationMetadata {
    pub fn from_webhook_data(
        case_number: u64,
        target_account: AccountId,
        requester: AccountId,
        webhook_data: &serde_json::Value
    ) -> Self {
        // Try to parse financial data from webhook if available
        let financial_data = webhook_data.get("financialData").and_then(|v| v.as_object());
        let analysis_data = webhook_data.get("analysisData").and_then(|v| v.as_object());

        Self {
            case_number,
            target_account,
            requester,
            investigation_date: U64(env::block_timestamp()),
            last_updated: U64(env::block_timestamp()),
            status: InvestigationStatus::Pending,
            financial_summary: FinancialSummary {
                total_usd_value: financial_data
                    .and_then(|d| d.get("totalUsdValue"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("0")
                    .to_string(),
                near_balance: financial_data
                    .and_then(|d| d.get("nearBalance"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("0")
                    .to_string(),
                defi_value: financial_data
                    .and_then(|d| d.get("defiValue"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("0")
                    .to_string(),
            },
            analysis_summary: AnalysisSummary {
                robust_summary: analysis_data
                    .and_then(|d| d.get("robustSummary"))
                    .and_then(|v| v.as_str())
                    .map(String::from),
                short_summary: analysis_data
                    .and_then(|d| d.get("shortSummary"))
                    .and_then(|v| v.as_str())
                    .map(String::from),
                transaction_count: analysis_data
                    .and_then(|d| d.get("transactionCount"))
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0),
                is_bot: analysis_data
                    .and_then(|d| d.get("isBot"))
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false),
            },
        }
    }

    // Add method to update metadata from webhook data
    pub fn update_from_webhook(&mut self, webhook_data: &serde_json::Value) {
        if let Some(financial_data) = webhook_data.get("financialData").and_then(|v| v.as_object()) {
            if let Some(total_usd) = financial_data.get("totalUsdValue").and_then(|v| v.as_str()) {
                self.financial_summary.total_usd_value = total_usd.to_string();
            }
            // Update other financial fields...
        }

        if let Some(analysis_data) = webhook_data.get("analysisData").and_then(|v| v.as_object()) {
            if let Some(robust_summary) = analysis_data.get("robustSummary").and_then(|v| v.as_str()) {
                self.analysis_summary.robust_summary = Some(robust_summary.to_string());
            }
            // Update other analysis fields...
        }

        self.last_updated = U64(env::block_timestamp());
    }
}