use std::prelude::v1::*;
use crate::*;
use near_contract_standards::non_fungible_token::Token;
use near_contract_standards::non_fungible_token::enumeration::NonFungibleTokenEnumeration;
use near_sdk::json_types::U128;
use near_sdk::AccountId;
use crate::investigation::InvestigationMetadata;

#[near_bindgen]
impl NonFungibleTokenEnumeration for Contract {
    fn nft_total_supply(&self) -> U128 {
        self.tokens.nft_total_supply()
    }

    fn nft_tokens(&self, from_index: Option<U128>, limit: Option<u64>) -> Vec<Token> {
        self.tokens.nft_tokens(from_index, limit)
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
        self.tokens.nft_tokens_for_owner(account_id, from_index, limit)
    }
}

impl Contract {
    // Helper methods for investigation-specific queries
    pub fn get_investigations_by_account(&self, account_id: AccountId) -> Vec<Token> {
        self.tokens.nft_tokens_for_owner(account_id, None, None)
    }

    pub fn get_investigation_metadata(&self, _token_id: TokenId) -> Option<InvestigationMetadata> {
        // Implementation
        None
    }

    pub fn get_all_investigations(&self) -> Vec<Token> {
        self.tokens.nft_tokens(None, None)
    }

    pub fn get_token_metadata(&self, token_id: TokenId) -> Option<TokenMetadata> {
        if let Some(token) = self.tokens.nft_token(token_id) {
            token.metadata
        } else {
            None
        }
    }
}
