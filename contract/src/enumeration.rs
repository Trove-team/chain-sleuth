use std::prelude::v1::*;
use crate::*;
use near_contract_standards::non_fungible_token::Token;
use near_contract_standards::non_fungible_token::enumeration::NonFungibleTokenEnumeration;
use near_sdk::json_types::U128;
use near_sdk::AccountId;
use near_contract_standards::non_fungible_token::TokenId;
use near_contract_standards::non_fungible_token::metadata::TokenMetadata;
use crate::investigation::InvestigationMetadata;

const MAX_LIMIT: u64 = 100;

#[near_bindgen]
impl NonFungibleTokenEnumeration for Contract {
    fn nft_total_supply(&self) -> U128 {
        self.tokens.nft_total_supply()
    }

    fn nft_tokens(&self, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        let limit = limit.unwrap_or(MAX_LIMIT).min(MAX_LIMIT);
        self.tokens.nft_tokens(from_index, Some(limit))
    }

    fn nft_supply_for_owner(&self, account_id: AccountId) -> U128 {
        self.tokens.nft_supply_for_owner(account_id)
    }

    fn nft_tokens_for_owner(
        &self,
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<Token> {
        let limit = limit.unwrap_or(MAX_LIMIT).min(MAX_LIMIT);
        self.tokens.nft_tokens_for_owner(account_id, from_index, Some(limit))
    }
}

impl Contract {
    // Helper methods for investigation-specific queries
    pub fn get_investigations_by_account(
        &self, 
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<Token> {
        let limit = limit.unwrap_or(MAX_LIMIT).min(MAX_LIMIT);
        self.tokens.nft_tokens_for_owner(account_id, from_index, Some(limit))
    }

    pub fn get_investigation_metadata(&self, token_id: TokenId) -> Option<InvestigationMetadata> {
        if let Some(token) = self.tokens.nft_token(token_id.clone()) {
            if let Some(metadata) = token.metadata {
                if let Some(extra) = metadata.extra {
                    match serde_json::from_str(&extra) {
                        Ok(investigation_metadata) => return Some(investigation_metadata),
                        Err(_) => {
                            env::log_str(&format!("Failed to parse metadata for token {}", token_id));
                            return None;
                        }
                    }
                }
            }
        }
        None
    }

    pub fn get_all_investigations(&self, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        let limit = limit.unwrap_or(MAX_LIMIT).min(MAX_LIMIT);
        self.tokens.nft_tokens(from_index, Some(limit))
    }

    pub fn get_token_metadata(&self, token_id: TokenId) -> Option<TokenMetadata> {
        self.tokens.nft_token(token_id).and_then(|token| token.metadata)
    }

    // Add new helper method
    pub fn get_investigations_by_status(&self, status: InvestigationStatus) -> Vec<Token> {
        self.tokens.nft_tokens(None, None)
            .into_iter()
            .filter(|token| {
                if let Some(metadata) = &token.metadata {
                    if let Some(extra) = &metadata.extra {
                        if let Ok(investigation_metadata) = serde_json::from_str::<InvestigationMetadata>(extra) {
                            return investigation_metadata.status == status;
                        }
                    }
                }
                false
            })
            .collect()
    }
}