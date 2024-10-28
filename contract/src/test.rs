#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::{testing_env, AccountId, NearToken};
    use crate::investigation::*;

    const MINT_STORAGE_COST: NearToken = NearToken::from_yoctonear(10_000_000_000_000_000_000_000); // 0.01 NEAR
    const QUERY_COST: NearToken = NearToken::from_yoctonear(1_000_000_000_000_000_000_000_000); // 1 NEAR

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id)
            .attached_deposit(MINT_STORAGE_COST); // Add default deposit
        builder
    }

    #[test]
    fn test_new_contract() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let contract = Contract::new(accounts(1));
        assert_eq!(contract.owner_id, accounts(1));
        assert_eq!(contract.case_number_counter, 0);
    }

    #[test]
    fn test_start_investigation() {
        let mut context = get_context(accounts(1));
        context.attached_deposit(QUERY_COST);
        testing_env!(context.build());
        
        let mut contract = Contract::new(accounts(1));
        let target = accounts(2);
        
        let result = contract.start_investigation(target.clone());
        assert!(result.is_ok());
        
        // Check if NFT was minted
        let token = contract.nft_token("1".to_string());
        assert!(token.is_some());
        
        let token = token.unwrap();
        assert_eq!(token.owner_id, target);
        
        // Verify investigation status
        let status = contract.investigation_status.get(&"1".to_string());
        assert!(status.is_some());
        assert!(matches!(status.unwrap(), InvestigationStatus::Pending));
    }

    #[test]
    fn test_webhook_update() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        
        let mut contract = Contract::new(accounts(1));
        
        // First start an investigation
        let target = accounts(2);
        contract.start_investigation(target.clone()).unwrap();
        
        // Create webhook update
        let update = MetadataUpdate {
            description: Some("Updated investigation details".to_string()),
            extra: serde_json::to_string(&InvestigationMetadata {
                case_number: 1,
                target_account: target.clone(),
                requester: accounts(1),
                investigation_date: U64(env::block_timestamp()),
                last_updated: U64(env::block_timestamp()),
                status: InvestigationStatus::Completed,
                financial_summary: FinancialSummary {
                    total_usd_value: "1000.00".to_string(),
                    near_balance: "100".to_string(),
                    defi_value: "900.00".to_string(),
                },
                analysis_summary: AnalysisSummary {
                    risk_score: "LOW".to_string(),
                    flags: vec!["NONE".to_string()],
                    details: "Clean transaction history".to_string(),
                }
            }).unwrap(),
        };
        
        // Test webhook update
        contract.handle_webhook_update("1".to_string(), "COMPLETE".to_string(), update).unwrap();
        
        // Verify updated status and metadata
        let token = contract.nft_token("1".to_string()).unwrap();
        let metadata = token.metadata.unwrap();
        assert!(metadata.description.unwrap().contains("Updated investigation"));
    }
}