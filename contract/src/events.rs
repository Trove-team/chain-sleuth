use near_sdk::serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct NftMintLog {
    pub owner_id: String,
    pub token_ids: Vec<String>,
    pub memo: Option<String>,
}

impl NftMintLog {
    pub fn log(&self) {
        near_sdk::env::log_str(&near_sdk::serde_json::to_string(self).unwrap());
    }
}