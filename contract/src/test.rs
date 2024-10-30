#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::{testing_env, AccountId, NearToken};

    const MINT_STORAGE_COST: NearToken = NearToken::from_yoctonear(10_000_000_000_000_000_000_000);

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id)
            .attached_deposit(MINT_STORAGE_COST);
        builder
    }

    #[test]
    fn test_failed_deserialization() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = Contract::new(accounts(1));
        
        let invalid_metadata = MetadataUpdate {
            description: Some("Test".to_string()),
            extra: "{invalid_json}".to_string(),
        };
        
        let result = contract.update_investigation_metadata(
            "1".to_string(),
            invalid_metadata,
            WebhookType::Progress
        );
        
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_webhook_data() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = Contract::new(accounts(1));
        let target = accounts(2);
        contract.start_investigation(target).unwrap();
        
        let metadata = InvestigationMetadata::new(1, target, accounts(1));
        let update = MetadataUpdate {
            description: Some("Test".to_string()),
            extra: serde_json::to_string(&metadata).unwrap(),
        };
        
        // Test with invalid webhook type
        let result = contract.update_investigation_metadata(
            "1".to_string(),
            update,
            WebhookType::Log // Log type shouldn't update metadata
        );
        
        assert!(result.is_err());
    }

    #[test]
    fn test_storage_limits() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = Contract::new(accounts(1));
        
        // Test with insufficient deposit
        let context = get_context(accounts(1))
            .attached_deposit(NearToken::from_near(0))
            .build();
        testing_env!(context);
        
        let result = contract.start_investigation(accounts(2));
        assert!(result.is_err());
    }
}