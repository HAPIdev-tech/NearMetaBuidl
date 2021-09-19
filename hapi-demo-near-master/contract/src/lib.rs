/*
 * Learn more about writing NEAR smart contracts with Rust:
 * https://github.com/near/near-sdk-rs
 *
 */

// To conserve gas, efficient serialization is achieved through Borsh (http://borsh.io/)
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::wee_alloc;
use near_sdk::{env, near_bindgen, BorshStorageKey, PanicOnDefault, AccountId};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::ValidAccountId;
use near_sdk::serde::{Deserialize, Serialize};

pub use crate::category::*;

mod category;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Structs in Rust are similar to other languages, and may include impl keyword as shown below
// Note: the names of the structs are not important when calling the smart contract, but the function names are
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Hapi {
    owner_id: AccountId,
    reports: LookupMap<AccountId, Category>,
}


/// Helper structure to for keys of the persistent collections.
#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    Reports
}

#[near_bindgen]
impl Hapi {
    #[init]
    pub fn new(owner_id: ValidAccountId) -> Self {
        Self {
            owner_id: owner_id.into(),
            reports: LookupMap::new(StorageKey::Reports),
        }
    }

    pub fn get_address_category(&self, account_id: ValidAccountId) -> Option<Category> {
        self.reports.get(&account_id.into())
    }


    pub fn report_address(&mut self, account_id: ValidAccountId, category: Category) {
        assert_eq!(self.owner_id, env::predecessor_account_id(), "No access");

        self.reports.insert(&account_id.into(), &category);
    }
}

/*
 * The rest of this file holds the inline tests for the code above
 * Learn more about Rust tests: https://doc.rust-lang.org/book/ch11-01-writing-tests.html
 *
 * To run from contract directory:
 * cargo test -- --nocapture
 *
 * From project root, to run in combination with frontend tests:
 * yarn test
 *
 */
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};
    use std::convert::TryInto;

    // mock the context for testing, notice "signer_account_id" that was accessed above from env::
    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }

    #[test]
    fn set_report_address() {
        let context = get_context(vec![], false);
        testing_env!(context);
        let admin_account: ValidAccountId = "carol_near".try_into().unwrap();
        let alice_account: ValidAccountId = "alice_near".try_into().unwrap();
        let bob_account: ValidAccountId = "bob_near".try_into().unwrap();
        let mut contract = Hapi::new(admin_account);

        contract.report_address(alice_account.clone(), Category::Safe);

        assert_eq!(
            contract.get_address_category(alice_account.clone()).unwrap(),
            Category::Safe
        );

        assert!(contract.get_address_category(alice_account).unwrap() != Category::TerroristFinancing);

        assert_eq!(
            contract.get_address_category(bob_account),
            None
        );
    }
}
