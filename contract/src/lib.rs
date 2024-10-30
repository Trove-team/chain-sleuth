#![cfg_attr(not(feature = "std"), no_std)]
use std::prelude::v1::*;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, LookupMap, UnorderedMap};
use near_sdk::json_types::U64;
use near_sdk::{
    env, 
    near_bindgen, 
    AccountId, 
    BorshStorageKey, 
    PanicOnDefault,
    PromiseOrValue,
    Promise,
    require,
    NearToken,
};

use near_contract_standards::non_fungible_token::{
    NonFungibleToken,
    Token,
    TokenId,
};
use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata,
    TokenMetadata,
    NFT_METADATA_SPEC,
};
use near_contract_standards::non_fungible_token::core::NonFungibleTokenCore;

// Local module imports
mod metadata;
mod investigation;
mod enumeration;
mod events;
mod webhook_mappings;

// Re-exports with explicit types
pub use crate::metadata::{MetadataUpdate};
pub use crate::investigation::{
    InvestigationMetadata, 
    InvestigationResponse, 
    InvestigationStatus,
    FinancialSummary,
    AnalysisSummary
};
pub use crate::events::InvestigationEvent;
pub use crate::webhook_mappings::WebhookType;

// Constants
pub const NFT_STANDARD_NAME: &str = "nep171";
pub const DEFAULT_ICON_URL: &str = "https://gateway.pinata.cloud/ipfs/QmYkT5eNLePKnvw9vLXNdLxFynp8amKUPaPZ74LhQxxdpu";
pub const DEFAULT_NFT_IMAGE_URL: &str = "https://gateway.pinata.cloud/ipfs/QmSNycrd5gWH7QAFKBVvKaT58c5S6B1tq9ScHP7thxvLWM";

#[derive(BorshSerialize)]
pub enum StorageKey {
    NonFungibleToken,
    Metadata,
    TokenMetadata,
    Enumeration,
    Approval,
    InvestigatedAccounts,
    InvestigationStatus,
    InvestigationData,
    FailedMints,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub tokens: NonFungibleToken,
    pub metadata: LazyOption<NFTContractMetadata>,
    pub case_number_counter: u64,
    pub investigated_accounts: LookupMap<AccountId, TokenId>,
    pub investigation_status: UnorderedMap<TokenId, InvestigationStatus>,
    pub investigation_data: UnorderedMap<TokenId, InvestigationMetadata>,
    pub failed_mints: UnorderedMap<TokenId, String>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id.clone(),
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::Metadata, None),
            owner_id,
            case_number_counter: 0,
            investigated_accounts: LookupMap::new(StorageKey::InvestigatedAccounts),
            investigation_status: UnorderedMap::new(StorageKey::InvestigationStatus),
            investigation_data: UnorderedMap::new(StorageKey::InvestigationData),
            failed_mints: UnorderedMap::new(StorageKey::FailedMints),
        }
    }

    #[payable]
    #[handle_result]
    pub fn start_investigation(&mut self, target_account: AccountId) -> Result<InvestigationResponse, near_sdk::Abort> {
        let _initial_storage_usage = env::storage_usage();

    // Check for existing investigation
    if let Some(token_id) = self.investigated_accounts.get(&target_account) {
        return Ok(InvestigationResponse {
            request_id: token_id.clone(),
            status: self.investigation_status.get(&token_id).unwrap_or(InvestigationStatus::Failed),
            message: Some("Investigation already exists".to_string()),
        });
    }

    // Generate case number and token ID
    let case_number = self.case_number_counter + 1;
    self.case_number_counter = case_number;
    let token_id = format!("Case File #{}: {}", case_number, target_account);

    // Create initial metadata
    let metadata = TokenMetadata {
        title: Some(format!("Case File #{}: {}", case_number, target_account)),
        description: Some("Investigation in progress...".to_string()),
        media: Some(DEFAULT_NFT_IMAGE_URL.to_string()),
        media_hash: None,
        copies: Some(1),
        issued_at: Some(env::block_timestamp().to_string()),
        expires_at: None,
        starts_at: None,
        updated_at: Some(env::block_timestamp().to_string()),
        extra: Some(serde_json::to_string(&InvestigationMetadata {
            case_number,
            target_account: target_account.clone(),
            requester: env::predecessor_account_id(),
            investigation_date: U64(env::block_timestamp()),
            status: InvestigationStatus::Pending,
            financial_summary: Some(FinancialSummary {
                total_usd_value: "0".to_string(),
                near_balance: "0".to_string(),
                defi_value: "0".to_string(),
            }),
            analysis_summary: Some(AnalysisSummary {
                robust_summary: None,
                short_summary: None,
                transaction_count: 0,
                is_bot: false,
            }),
        }).unwrap()),
        reference: None,
        reference_hash: None,
    };

        // Mint NFT
        self.tokens.internal_mint(
            token_id.clone(),
            target_account.clone(),
            Some(metadata.clone())
    );

    // Update tracking
    self.investigated_accounts.insert(&target_account, &token_id);
    self.investigation_status.insert(&token_id, &InvestigationStatus::Pending);

    // Calculate required storage deposit after all storage operations
    // Calculate required storage deposit after all storage operations
let required_deposit = NearToken::from_yoctonear(10_000_000_000_000_000_000_000u128); // 0.01 NEAR
let deposit = env::attached_deposit(); // This is already NearToken

require!(
    deposit >= required_deposit,
    "Must attach at least 0.01 NEAR for storage"
);

// If they sent more than needed, refund it
if deposit > required_deposit {
    let refund = deposit.saturating_sub(required_deposit); // Use saturating_sub for safe subtraction
    Promise::new(env::predecessor_account_id())
            .transfer(refund);
        }
        // Log event
    InvestigationEvent::Started {
        target_account: target_account.to_string(),
        token_id: token_id.clone(),
        case_number,
        timestamp: U64(env::block_timestamp()),
    }.log();

    Ok(InvestigationResponse {
        request_id: token_id,
        status: InvestigationStatus::Pending,
        message: None,
        })
    }

    #[payable]
    pub fn update_investigation_metadata(
        &mut self,
        token_id: TokenId,
        metadata_update: MetadataUpdate,
        webhook_type: WebhookType
    ) -> Result<(), near_sdk::Abort> {
        if env::predecessor_account_id() != self.owner_id {
            let error_msg = format!(
                "Unauthorized update attempt from: {}", 
                env::predecessor_account_id()
            );
            env::log_str(&error_msg);
            return Err(near_sdk::Abort);
        }

        // Detailed deserialization error logging
        let updated_metadata: InvestigationMetadata = match serde_json::from_str(&metadata_update.extra) {
            Ok(metadata) => metadata,
            Err(e) => {
                InvestigationEvent::DeserializationError {
                    context: format!("Token ID: {}", token_id),
                    error: e.to_string(),
                    timestamp: U64(env::block_timestamp()),
                }.log();
                env::panic_str(&format!("Metadata deserialization failed: {}", e));
            }
        };

        // Log the update attempt
        env::log_str(&format!(
            "Updating metadata for token {}: {:?}", 
            token_id, 
            webhook_type
        ));

        // Update both storage locations
        self.investigation_data.insert(&token_id, &updated_metadata);
        self.investigation_status.insert(&token_id, &updated_metadata.status);

        // Log the update
        InvestigationEvent::MetadataUpdated {
            token_id: token_id.clone(),
            timestamp: U64(env::block_timestamp()),
        }.log();

        Ok(())
    }

    #[payable]
    #[handle_result]
    pub fn retry_investigation(&mut self, token_id: TokenId) -> Result<(), near_sdk::Abort> {
        let failed_metadata_str = self.failed_mints.get(&token_id)
            .ok_or_else(|| env::panic_str("No failed mint found for this token"))?;
        
        let failed_metadata: InvestigationMetadata = serde_json::from_str(&failed_metadata_str)
            .map_err(|_| env::panic_str("Invalid failed metadata format"))?;

        let token_metadata = TokenMetadata {
            title: Some(format!("Investigation #{}", token_id)),
            description: Some("Investigation in progress...".to_string()),
            media: None,
            media_hash: None,
            copies: Some(1),
            issued_at: Some(env::block_timestamp().to_string()),
            expires_at: None,
            starts_at: None,
            updated_at: None,
            extra: None,
            reference: None,
            reference_hash: None,
        };

        // Mint the token with metadata using internal_mint_with_refund
        self.tokens.internal_mint_with_refund(
            token_id.clone(),
            failed_metadata.target_account.clone(),
            Some(token_metadata),
            None  
        );

        self.investigated_accounts.insert(&failed_metadata.target_account, &token_id);
        
        // Remove from failed mints
        self.failed_mints.remove(&token_id);
        
        Ok(())
    }

    // View methods
    pub fn get_investigation_status(&self, token_id: TokenId) -> Option<InvestigationStatus> {
        self.investigation_status.get(&token_id)
    }

    pub fn get_investigation_by_account(&self, account_id: AccountId) -> Option<Token> {
        if let Some(token_id) = self.investigated_accounts.get(&account_id) {
            self.tokens.nft_token(token_id)
        } else {
            None
        }
    }

    pub fn nft_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }

    #[private]
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        // Enhanced logging for migration
        env::log_str("Starting contract migration...");
        
        let old_state: Contract = env::state_read().map_err(|e| {
            env::log_str(&format!("Failed to read old state: {:?}", e));
            env::panic_str("State read failed during migration")
        }).expect("Failed to read state");
        
        env::log_str(&format!(
            "Old state loaded - Version: {}, Cases: {}", 
            old_state.version, 
            old_state.case_number_counter
        ));

        require!(
            old_state.version == 1,
            "Can only migrate from version 1"
        );

        let new_contract = Self {
            version: old_state.version + 1,
            tokens: old_state.tokens,
            owner_id: old_state.owner_id.clone(),
            metadata: old_state.metadata,
            case_number_counter: old_state.case_number_counter,
            investigated_accounts: LookupMap::new(StorageKey::InvestigatedAccounts),
            investigation_status: UnorderedMap::new(StorageKey::InvestigationStatus),
            investigation_data: UnorderedMap::new(StorageKey::InvestigationData),
            failed_mints: UnorderedMap::new(StorageKey::FailedMints),
        };

        // Log successful migration
        InvestigationEvent::ContractMigrated {
            old_version: old_state.version,
            new_version: new_contract.version,
            timestamp: U64(env::block_timestamp()),
        }.log();

        new_contract
    }

    fn create_token_metadata(&self, investigation: &InvestigationMetadata) -> TokenMetadata {
        TokenMetadata {
            title: Some(format!("Case File #{}: {}", 
                investigation.case_number, 
                investigation.target_account
            )),
            description: Some(investigation.summary.clone()
                .unwrap_or_else(|| "Investigation in progress...".to_string())),
            media: Some(DEFAULT_NFT_IMAGE_URL.to_string()),
            copies: Some(1),
            issued_at: Some(env::block_timestamp().to_string()),
            updated_at: Some(env::block_timestamp().to_string()),
            extra: Some(serde_json::to_string(&investigation).unwrap_or_default()),
            // Remove unused fields
            media_hash: None,
            expires_at: None,
            starts_at: None,
            reference: None,
            reference_hash: None,
        }
    }
}

#[near_bindgen]
impl NonFungibleTokenCore for Contract {
    #[payable]
    fn nft_transfer(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
    ) {
        self.tokens.nft_transfer(receiver_id, token_id, approval_id, memo)
    }

    #[payable]
    fn nft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<bool> {
        self.tokens.nft_transfer_call(receiver_id, token_id, approval_id, memo, msg)
    }

    fn nft_token(&self, token_id: TokenId) -> Option<Token> {
        self.tokens.nft_token(token_id)
    }
}

// Keep your test module at the bottom
#[cfg(test)]
#[cfg(feature = "test-utils")]
mod tests {
    use super::*;
    use near_sdk::test_utils::accounts;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn get_context() -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(accounts(0))
            .predecessor_account_id(accounts(0));
        builder
    }

    #[test]
    fn test_new() {
        let context = get_context();
        testing_env!(context.build());

        let contract = Contract::new(accounts(0));
        assert_eq!(contract.owner_id, accounts(0));
        assert_eq!(contract.case_number_counter, 0);
    }

    // Additional tests can be added here
}

