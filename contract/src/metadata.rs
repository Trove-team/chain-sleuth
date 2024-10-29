use std::prelude::v1::*;
use near_contract_standards::non_fungible_token::metadata::{
    NFTContractMetadata, TokenMetadata, NFT_METADATA_SPEC,
};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct MetadataUpdate {
    pub description: Option<String>,
    pub extra: String,
}

pub trait MetadataValidator {
    fn validate(&self) -> bool;
    fn validate_title(&self) -> bool;
    fn validate_description(&self) -> bool;
}

impl MetadataValidator for TokenMetadata {
    fn validate(&self) -> bool {
        self.validate_title() && self.validate_description()
    }

    fn validate_title(&self) -> bool {
        if let Some(ref title) = self.title {
            return title.len() <= 200;
        }
        true
    }

    fn validate_description(&self) -> bool {
        if let Some(ref description) = self.description {
            return description.len() <= 2048;
        }
        true
    }
}

