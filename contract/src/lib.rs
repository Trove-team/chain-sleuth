use near_sdk::NearToken;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, LookupMap, UnorderedMap};
use near_sdk::serde_json::{json, Value};
use near_sdk::serde::{Serialize, Deserialize};  
use near_sdk::json_types::U64;  
use near_sdk::{
    env, 
    near_bindgen, 
    AccountId, 
    PanicOnDefault, 
    BorshStorageKey, 
    PromiseOrValue, 
    Promise
};
use near_contract_standards::non_fungible_token::{Token, NonFungibleToken};
use near_contract_standards::non_fungible_token::core::NonFungibleTokenCore;
use near_contract_standards::non_fungible_token::NonFungibleTokenResolver;
use near_contract_standards::non_fungible_token::metadata::{NFTContractMetadata, TokenMetadata};

//pub use crate::metadata::*;
pub use crate::investigation::{InvestigationRequest, InvestigationStatus, InvestigationData, InvestigationResponse};
pub use crate::enumeration::*;
pub use crate::events::*;

mod metadata;
mod investigation;
mod enumeration;
mod events;

pub const NFT_METADATA_SPEC: &str = "nft-1.0.0";
pub const NFT_STANDARD_NAME: &str = "nep171";
pub const DEFAULT_ICON_URL: &str = "https://gateway.pinata.cloud/ipfs/QmYkT5eNLePKnvw9vLXNdLxFynp8amKUPaPZ74LhQxxdpu";
pub const DEFAULT_NFT_IMAGE_URL: &str = "https://gateway.pinata.cloud/ipfs/QmSNycrd5gWH7QAFKBVvKaT58c5S6B1tq9ScHP7thxvLWM";
pub const QUERY_COST: NearToken = NearToken::from_yoctonear(1_000_000_000_000_000_000_000_000); // 1 NEAR

pub type TokenId = String;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct InvestigationProgress {
    pub status: InvestigationStatus,
    pub start_time: U64,
    pub last_updated: U64,
    pub progress_message: Option<String>
}

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    NonFungibleToken,
    TokenMetadata,
    Enumeration,
    TokensPerOwner,
    TokenPerOwnerInner { account_hash: Vec<u8> },
    InvestigationData,
    InvestigatedAccounts,
    PendingInvestigations,
    InvestigationProgress,
    NFTContractMetadata,
    Approvals,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub version: u32,  // Add version for migration management
    pub owner_id: AccountId,
    pub case_number_counter: u64,
    pub tokens: NonFungibleToken,
    pub investigation_data_by_id: UnorderedMap<TokenId, InvestigationData>,
    pub investigated_accounts: LookupMap<AccountId, TokenId>,
    pub pending_investigations: UnorderedMap<String, InvestigationRequest>,
    pub metadata: LazyOption<NFTContractMetadata>,
    pub icon_url: String,
    pub nft_image_url: String,
    pub investigation_progress: UnorderedMap<String, InvestigationProgress>,
}

fn parse_metadata_summary(summary: &str) -> Value {
    let mut parsed = json!({
        "raw_data": summary,
        "parsed_fields": {
            "account_id": "",
            "created_date": "",
            "last_updated": "",
            "transaction_count": "",
            "total_usd_value": "",
            "defi_value": "",
            "near_balance": "",
            "usdc_balance": "",
            "neko_balance": "",
            "is_bot": "",
            "eth_address": "",
            "top_interactions": "",
            "nft_activity": "",
            "cross_chain": "",
            "trading_activity": ""
        }
    });

    // Extract from Neo4j-friendly format
    for pair in summary.split(";") {
        if let Some((key, value)) = pair.split_once(":") {
            let clean_key = key.trim()
                .replace("**Neo4j-Friendly Metadata Summary:**", "")
                .trim()
                .to_string();
            let clean_value = value.trim().to_string();
            
            match clean_key.as_str() {
                "Account ID" => parsed["parsed_fields"]["account_id"] = json!(clean_value),
                "Created" => parsed["parsed_fields"]["created_date"] = json!(clean_value),
                "Last Updated" => parsed["parsed_fields"]["last_updated"] = json!(clean_value),
                "Transaction Count" => parsed["parsed_fields"]["transaction_count"] = json!(clean_value),
                "Total USD Value" => parsed["parsed_fields"]["total_usd_value"] = json!(clean_value),
                "DeFi Value" => parsed["parsed_fields"]["defi_value"] = json!(clean_value),
                "NEAR Balance" => parsed["parsed_fields"]["near_balance"] = json!(clean_value),
                "USDC Balance" => parsed["parsed_fields"]["usdc_balance"] = json!(clean_value),
                "NEKO Balance" => parsed["parsed_fields"]["neko_balance"] = json!(clean_value),
                "Not a Bot" => parsed["parsed_fields"]["is_bot"] = json!("false"),
                "Probable Ethereum Address" => parsed["parsed_fields"]["eth_address"] = json!(clean_value),
                "Top Interactions" => parsed["parsed_fields"]["top_interactions"] = json!(clean_value),
                "NFT Activity" => parsed["parsed_fields"]["nft_activity"] = json!(clean_value),
                "Cross-Chain" => parsed["parsed_fields"]["cross_chain"] = json!(clean_value),
                _ => if clean_key.contains("trading") { 
                    parsed["parsed_fields"]["trading_activity"] = json!(clean_value)
                }
            }
        }
    }

    parsed
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(owner_id: AccountId) -> Self {
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
            version: 1, // Initial version
            owner_id: owner_id.clone(),
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id,
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approvals),
            ),
            investigation_data_by_id: UnorderedMap::new(StorageKey::InvestigationData),
            investigated_accounts: LookupMap::new(StorageKey::InvestigatedAccounts),
            pending_investigations: UnorderedMap::new(StorageKey::PendingInvestigations),
            metadata: LazyOption::new(StorageKey::NFTContractMetadata, Some(&metadata)),
            case_number_counter: 0,
            icon_url: DEFAULT_ICON_URL.to_string(),
            nft_image_url: DEFAULT_NFT_IMAGE_URL.to_string(),
            investigation_progress: UnorderedMap::new(StorageKey::InvestigationProgress),
        }
    }

    // Add migration method for future updates
    #[private]
    pub fn migrate(&mut self) -> bool {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only owner can migrate contract"
        );
        match self.version {
            1 => {
                // Future migration code from version 1 to 2
                self.version = 2;
                true
            }
            _ => false
        }
    }

    #[payable]
pub fn request_investigation(&mut self, target_account: AccountId) -> InvestigationResponse {
    // Validate input
    assert!(
        env::is_valid_account_id(target_account.as_bytes()),
        "Invalid target account ID"
    );

    let request_id = target_account.to_string();
    
    // Check for existing investigation
    if let Some(token_id) = self.investigated_accounts.get(&target_account) {
        if env::attached_deposit() > NearToken::from_yoctonear(0) {
            Promise::new(env::predecessor_account_id()).transfer(env::attached_deposit());
        }
        env::log_str(&format!(
            "Existing investigation found for account: {}. Token ID: {}",
            target_account, token_id
        ));
        return InvestigationResponse {
            request_id: token_id,
            is_existing: true,
        };
    }

    // Verify payment with detailed error
    assert!(
        env::attached_deposit() >= QUERY_COST,
        "Insufficient deposit. Required: {} NEAR, Provided: {} NEAR",
        QUERY_COST.as_near(),
        env::attached_deposit().as_near()
    );

    // Create new investigation request
    let request = InvestigationRequest {
        requester: env::predecessor_account_id(),
        target_account: target_account.clone(),
        timestamp: U64(env::block_timestamp()),
        status: InvestigationStatus::Pending,
    };

    self.pending_investigations.insert(&request_id, &request);
    env::log_str(&format!(
        "New investigation requested - Account: {}, Request ID: {}",
        target_account, request_id
    ));

    InvestigationResponse {
        request_id,
        is_existing: false,
    }
}

    #[payable]
    pub fn complete_investigation(
        &mut self,
        request_id: String,
        robust_summary: String,
        short_summary: String,
    ) -> (TokenId, String) {
        // Get request with detailed error
        let request = self.pending_investigations.get(&request_id)
            .unwrap_or_else(|| env::panic_str(&format!(
                "Investigation request not found: {}", request_id
            )));

        // Allow either the contract owner or the original requester to complete the investigation
        assert!(
            env::predecessor_account_id() == self.owner_id || env::predecessor_account_id() == request.requester,
            "Unauthorized: Only owner or original requester can complete investigations"
        );

        // Validate summaries
        assert!(!robust_summary.is_empty(), "Robust summary cannot be empty");
        assert!(!short_summary.is_empty(), "Short summary cannot be empty");

        // Check for existing token
        assert!(
            !self.investigated_accounts.contains_key(&request.target_account),
            "Investigation already exists for account: {}",
            request.target_account
        );

        let case_number = self.case_number_counter + 1;
        self.case_number_counter = case_number;
        
        let token_id = format!("case-file-{}-{}", case_number, request.target_account);
        let current_timestamp = env::block_timestamp().to_string();

        // Parse the Neo4j-friendly short summary
        let parsed_metadata = parse_metadata_summary(&short_summary);
        
        // Helper functions for cleaning and parsing values
        let clean_currency = |value: &str| -> f64 {
            value.replace("$", "")
                 .replace(",", "")
                 .parse()
                 .unwrap_or(0.0)
        };

        let clean_count = |value: &str| -> u64 {
            value.replace(",", "")
                 .parse()
                 .unwrap_or(0)
        };

        let token_metadata = TokenMetadata {
            title: Some(format!("Case File #{}: {}", case_number, request.target_account)),
            description: Some(robust_summary.clone()), // Using comprehensive summary for description
            media: Some(self.nft_image_url.clone()), // Use the stored NFT image URL
            media_hash: None,
            copies: Some(1),
            issued_at: Some(current_timestamp.clone()),
            expires_at: None,
            starts_at: None,
            updated_at: Some(current_timestamp.clone()),
            extra: Some(json!({
                "case_number": case_number,
                "investigated_account": request.target_account.to_string(),
                "investigator": request.requester.to_string(),
                "investigation_date": current_timestamp,
                "summaries": {
                    "robust_summary": robust_summary,
                    "short_summary": short_summary
                },
                "parsed_data": parsed_metadata
            }).to_string()),
            reference: None,
            reference_hash: None,
        };

        // Store NFT data
        self.tokens.internal_mint(
            token_id.clone(),
            request.target_account.clone(),
            Some(token_metadata),
        );

        // Create investigation data from parsed fields
        let investigation_data = InvestigationData {
            subject_account: request.target_account.clone(),
            investigator: request.requester,
            creation_date: env::block_timestamp(),
            last_updated: env::block_timestamp(),
            transaction_count: clean_count(
                parsed_metadata["parsed_fields"]["transaction_count"]
                    .as_str()
                    .unwrap_or("0")
            ),
            total_usd_value: clean_currency(
                parsed_metadata["parsed_fields"]["total_usd_value"]
                    .as_str()
                    .unwrap_or("0.0")
            ),
            defi_value: Some(clean_currency(
                parsed_metadata["parsed_fields"]["defi_value"]
                    .as_str()
                    .unwrap_or("0.0")
            )),
            near_balance: Some(clean_currency(
                parsed_metadata["parsed_fields"]["near_balance"]
                    .as_str()
                    .unwrap_or("0.0")
            )),
            reputation_score: None,
            eth_address: Some(
                parsed_metadata["parsed_fields"]["eth_address"]
                    .as_str()
                    .unwrap_or("N/A")
                    .to_string()
            ),
            summary: short_summary.clone(),
        };

        self.investigation_data_by_id.insert(&token_id, &investigation_data);
        self.investigated_accounts.insert(&request.target_account, &token_id);
        self.pending_investigations.remove(&request_id);

        env::log_str(&format!(
            "Investigation successfully completed - Account: {}, Token ID: {}, Case #{}",
            request.target_account, token_id, case_number
        ));

        (token_id, robust_summary)
    }

    // View methods
    pub fn get_investigation_status(&self, request_id: String) -> Option<InvestigationStatus> {
        self.pending_investigations.get(&request_id).map(|req| req.status)
    }

    pub fn get_investigation_result(&self, target_account: AccountId) -> Option<(String, String)> {
        if let Some(token_id) = self.investigated_accounts.get(&target_account) {
            if let Some(token) = self.nft_token(token_id) {
                if let Some(metadata) = token.metadata {
                    return Some((
                        metadata.description.unwrap_or_default(),
                        metadata.extra.unwrap_or_default(),
                    ));
                }
            }
        }
        None
    }
    
    // Fix for update_investigation_status method
    pub fn update_investigation_status(
        &mut self,
        request_id: String,
        status: InvestigationStatus,
    ) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only owner can update status"
        );
    
        let mut request = self.pending_investigations.get(&request_id)
            .expect("Investigation request not found");
        
        // Clone status for the log message
        let status_clone = status.clone();
        request.status = status;
        self.pending_investigations.insert(&request_id, &request);
    
        env::log_str(&format!(
            "Investigation status updated: {} -> {:?}",
            request_id, status_clone
        ));
    }

    pub fn nft_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }

    pub fn get_token_full_metadata(&self, token_id: TokenId) -> Option<(TokenMetadata, InvestigationData)> {
        if let Some(token) = self.tokens.nft_token(token_id.clone()) {
            if let Some(metadata) = token.metadata {
                if let Some(investigation_data) = self.investigation_data_by_id.get(&token_id) {
                    return Some((metadata, investigation_data));
                }
            }
        }
        None
    }

    pub fn nft_contract_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }

    pub fn nft_mint_info(&self, token_id: TokenId) -> Option<(String, String, String)> {
        if let Some(token) = self.nft_token(token_id) {
            if let Some(metadata) = token.metadata {
                return Some((
                    metadata.title.unwrap_or_default(),
                    metadata.description.unwrap_or_default(),
                    metadata.extra.unwrap_or_default()
                ));
            }
        }
        None
    }

    pub fn get_investigation_details(&self, token_id: TokenId) -> Option<(TokenMetadata, InvestigationData)> {
        if let Some(token) = self.nft_token(token_id.clone()) {
            if let Some(metadata) = token.metadata {
                if let Some(investigation_data) = self.investigation_data_by_id.get(&token_id) {
                    return Some((metadata, investigation_data));
                }
            }
        }
        None
    }

    pub fn update_icon_url(&mut self, new_url: String) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only the owner can update the icon URL"
        );
        self.icon_url = new_url;
    }

    pub fn update_nft_image_url(&mut self, new_url: String) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only the owner can update the NFT image URL"
        );
        self.nft_image_url = new_url;
    }

    // View method to check contract version and state
    pub fn get_contract_info(&self) -> Value {
        json!({
            "version": self.version,
            "owner_id": self.owner_id,
            "total_cases": self.case_number_counter,
            "metadata": self.metadata.get().unwrap()
        })
    }

    pub fn update_investigation_progress(
        &mut self,
        request_id: String,
        status: InvestigationStatus,
        message: Option<String>
    ) {
        let request = self.pending_investigations.get(&request_id)
            .expect("Investigation not found");
            
        assert!(
            env::predecessor_account_id() == self.owner_id || 
            env::predecessor_account_id() == request.requester,
            "Unauthorized to update progress"
        );
        
        let progress = InvestigationProgress {
            status,
            start_time: request.timestamp,
            last_updated: U64(env::block_timestamp()),
            progress_message: message
        };
        
        self.investigation_progress.insert(&request_id, &progress);

        env::log_str(&format!(
            "Investigation progress updated - Request ID: {}, Status: {:?}",
            request_id, status
        ));
    }

    pub fn get_investigation_progress(&self, request_id: String) -> Option<InvestigationProgress> {
        self.investigation_progress.get(&request_id)
    }

    pub fn list_pending_investigations(&self) -> Vec<(String, InvestigationProgress)> {
        self.investigation_progress
            .iter()
            .collect()
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

#[near_bindgen]
impl NonFungibleTokenResolver for Contract {
    #[private]
    fn nft_resolve_transfer(
        &mut self,
        previous_owner_id: AccountId,
        receiver_id: AccountId,
        token_id: TokenId,
        approved_account_ids: Option<std::collections::HashMap<AccountId, u64>>,
    ) -> bool {
        self.tokens.nft_resolve_transfer(
            previous_owner_id,
            receiver_id,
            token_id,
            approved_account_ids
        )
    }
}

