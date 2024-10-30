use near_contract_standards::non_fungible_token::metadata::{
    TokenMetadata,
};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::env;

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct MetadataUpdate {
    pub description: Option<String>,
    pub extra: String,
}

impl MetadataUpdate {
    pub fn to_token_metadata(&self) -> Result<TokenMetadata, String> {
        Ok(TokenMetadata {
            title: None,
            description: self.description.clone(),
            media: None,
            media_hash: None,
            copies: None,
            issued_at: None,
            expires_at: None,
            starts_at: None,
            updated_at: Some(env::block_timestamp().to_string()),
            extra: Some(self.extra.clone()),
            reference: None,
            reference_hash: None,
        })
    }
}