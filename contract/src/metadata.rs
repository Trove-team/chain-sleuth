use near_sdk::require;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::json_types::Base64VecU8;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct NFTContractMetadata {
    pub spec: String,
    pub name: String,
    pub symbol: String,
    pub icon: Option<String>,
    pub base_uri: Option<String>,
    pub reference: Option<String>,
    pub reference_hash: Option<Base64VecU8>,
}

impl NFTContractMetadata {
    pub fn assert_valid(&self) {
        require!(self.spec.len() < 32, "Spec is too long");
        require!(self.name.len() < 32, "Name is too long");
        require!(self.symbol.len() < 10, "Symbol is too long");
        if let Some(ref icon) = self.icon {
            require!(icon.len() < 2048, "Icon URL is too long");
        }
    }
}