#![cfg_attr(not(feature = "std"), no_std)]
use std::prelude::v1::*;  // Brings in String, Vec, etc.
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
    require,
};

#[macro_use]
extern crate near_sdk_macros;

// Import abort from env
use near_sdk::env::panic_str;

use near_sdk::serde::{Serialize, Deserialize};
use near_sdk::serde_json;

use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata, TokenMetadata,
};
use near_contract_standards::non_fungible_token::{Token, NonFungibleToken, TokenId};
use near_contract_standards::non_fungible_token::core::NonFungibleTokenCore;


pub use crate::investigation::*;

pub use crate::events::*;
pub use crate::webhook_mappings::*;

mod metadata;
mod investigation;
mod enumeration;
mod events;
mod webhook_mappings;

// Constants
pub const NFT_METADATA_SPEC: &str = "nft-1.0.0";
pub const NFT_STANDARD_NAME: &str = "nep171";
pub const DEFAULT_ICON_URL: &str = "https://gateway.pinata.cloud/ipfs/QmYkT5eNLePKnvw9vLXNdLxFynp8amKUPaPZ74LhQxxdpu";
pub const DEFAULT_NFT_IMAGE_URL: &str = "https://gateway.pinata.cloud/ipfs/QmSNycrd5gWH7QAFKBVvKaT58c5S6B1tq9ScHP7thxvLWM";

#[derive(BorshSerialize, BorshDeserialize, BorshStorageKey)]
pub enum StorageKey {
    NonFungibleToken,
    TokenMetadata,
    TokenEnumeration,
    Approvals,
    ContractMetadata,
    InvestigationStatus { hash: Vec<u8> },
    FailedMints { hash: Vec<u8> },
    InvestigatedAccounts { hash: Vec<u8> },
    PendingInvestigations { hash: Vec<u8> },
}

impl StorageKey {
    pub fn for_investigation_status(account_id: &AccountId) -> Self {
        Self::InvestigationStatus {
            hash: env::sha256(account_id.as_bytes())
        }
    }

    pub fn for_failed_mints(account_id: &AccountId) -> Self {
        Self::FailedMints {
            hash: env::sha256(account_id.as_bytes())
        }
    }

    pub fn for_investigated_accounts(account_id: &AccountId) -> Self {
        Self::InvestigatedAccounts {
            hash: env::sha256(account_id.as_bytes())
        }
    }

    pub fn for_pending_investigations(account_id: &AccountId) -> Self {
        Self::PendingInvestigations {
            hash: env::sha256(account_id.as_bytes())
        }
    }
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub owner_id: AccountId,
    pub tokens: NonFungibleToken,
    pub metadata: LazyOption<NFTContractMetadata>,
    pub case_number_counter: u64,
    pub investigated_accounts: LookupMap<AccountId, TokenId>,
    pub investigation_status: UnorderedMap<TokenId, InvestigationStatus>,
    pub failed_mints: UnorderedMap<TokenId, InvestigationMetadata>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        require!(!env::state_exists(), "Already initialized");
        
        let metadata = NFTContractMetadata {
            spec: NFT_METADATA_SPEC.to_string(),
            name: "Chain Sleuth".to_string(),
            symbol: "CSI".to_string(),
            icon: Some(DEFAULT_ICON_URL.to_string()),
            base_uri: None,
            reference: None,
            reference_hash: None,
        };
        metadata.assert_valid();

        Self {
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id.clone(),
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::TokenEnumeration),
                Some(StorageKey::Approvals),
            ),
            metadata: LazyOption::new(
                StorageKey::ContractMetadata,
                Some(&metadata)
            ),
            owner_id,
            case_number_counter: 0,
            investigated_accounts: LookupMap::new(
                StorageKey::InvestigatedAccounts { 
                    hash: vec![] 
                }
            ),
            investigation_status: UnorderedMap::new(
                StorageKey::InvestigationStatus { 
                    hash: vec![] 
                }
            ),
            failed_mints: UnorderedMap::new(
                StorageKey::FailedMints { 
                    hash: vec![] 
                }
            ),
        }
    }

    #[payable]
    #[handle_result]
    pub fn start_investigation(&mut self, target_account: AccountId) -> Result<InvestigationResponse, near_sdk::Abort> {
        // Check if investigation already exists
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
            }).unwrap()),
            reference: None,
            reference_hash: None,
        };

        // Directly call internal_mint
        self.tokens.internal_mint(
            token_id.clone(),
            target_account.clone(),
            Some(metadata.clone())
        );

        // Update tracking
        self.investigated_accounts.insert(&target_account, &token_id);
        self.investigation_status.insert(&token_id, &InvestigationStatus::Pending);

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

    pub fn update_investigation_metadata(
        &mut self,
        token_id: TokenId,
        metadata_update: MetadataUpdate,
        webhook_type: WebhookType,
    ) -> bool {
        // Only owner can update metadata
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only contract owner can update metadata"
        );

        let token = self.tokens.nft_token(token_id.clone())
            .expect("Token not found");
        
        let mut token_metadata = token.metadata
            .expect("No metadata found");

        // Update metadata
        if let Some(description) = metadata_update.description {
            token_metadata.description = Some(description);
        }

        // Parse and update extra data
        if let Some(current_extra) = token_metadata.extra.as_ref() {
            let mut extra: InvestigationMetadata = serde_json::from_str(current_extra)
                .expect("Invalid metadata format");

            // Update with new data
            let update_data: InvestigationMetadata = serde_json::from_str(&metadata_update.extra)
                .expect("Invalid update data format");

            extra.last_updated = U64(env::block_timestamp());
            extra.status = InvestigationStatus::from(webhook_type.clone());  // Update status based on webhook
            extra.financial_summary = update_data.financial_summary;
            extra.analysis_summary = update_data.analysis_summary;

            token_metadata.extra = Some(serde_json::to_string(&extra).unwrap());
            token_metadata.updated_at = Some(env::block_timestamp().to_string());
        }

        // Update token metadata
        self.tokens.token_metadata_by_id.as_mut()
            .unwrap()
            .insert(&token_id, &token_metadata);

        // Update status
        self.investigation_status.insert(&token_id, &InvestigationStatus::Completed);

        // Log event
        InvestigationEvent::MetadataUpdated {
            token_id: token_id.clone(),
            timestamp: U64(env::block_timestamp()),
        }.log();

        true
    }

    #[payable]
    #[handle_result]
    pub fn retry_investigation(&mut self, token_id: TokenId) -> Result<bool, near_sdk::Abort> {
        // Only owner can retry
        if env::predecessor_account_id() != self.owner_id {
            return Err(panic_str("Only contract owner can retry investigations"));
        }

        let failed_metadata = self.failed_mints.get(&token_id)
            .expect("No failed mint found for retry");

        // Create token metadata
        let token_metadata = TokenMetadata {
            title: Some(format!("Case File #{}: {}", failed_metadata.case_number, failed_metadata.target_account)),
            description: Some("Investigation in progress...".to_string()),
            media: Some(DEFAULT_NFT_IMAGE_URL.to_string()),
            media_hash: None,
            copies: Some(1),
            issued_at: Some(env::block_timestamp().to_string()),
            expires_at: None,
            starts_at: None,
            updated_at: Some(env::block_timestamp().to_string()),
            extra: Some(serde_json::to_string(&failed_metadata).unwrap()),
            reference: None,
            reference_hash: None,
        };

        // Directly call internal_mint
        self.tokens.internal_mint(
            token_id.clone(),
            failed_metadata.target_account.clone(),
            Some(token_metadata)
        );

        // Update tracking
        self.investigated_accounts.insert(&failed_metadata.target_account, &token_id);
        self.investigation_status.insert(&token_id, &InvestigationStatus::Pending);
        self.failed_mints.remove(&token_id);

        // Log event
        InvestigationEvent::RetryAttempted {
            token_id: token_id.clone(),
            attempt: 1, // Could track multiple attempts if needed
            timestamp: U64(env::block_timestamp()),
        }.log();

        Ok(true)
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

