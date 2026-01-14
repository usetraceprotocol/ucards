// Confidential instruction for encrypted transfer
// This will be compiled by Arcium's Arcis compiler

use arcium_sdk::prelude::*;

/// Encrypted transfer confidential instruction
/// Verifies balance and transfers encrypted tokens
#[confidential_instruction]
pub fn encrypted_transfer(
    from_balance: EncryptedU128,      // Sender's encrypted balance
    to_balance: EncryptedU128,        // Recipient's encrypted balance
    amount: EncryptedU128,             // Encrypted transfer amount
) -> (EncryptedU128, EncryptedU128) {
    // Verify sender has sufficient balance
    let has_sufficient = from_balance >= amount;
    
    // If sufficient, perform transfer
    // Otherwise, transfer 0
    let transfer_amount = if has_sufficient {
        amount
    } else {
        EncryptedU128::zero()
    };
    
    // Update balances
    let new_from_balance = from_balance - transfer_amount;
    let new_to_balance = to_balance + transfer_amount;
    
    (new_from_balance, new_to_balance)
}

/// Verify encrypted balance is sufficient
#[confidential_instruction]
pub fn verify_balance(
    balance: EncryptedU128,
    required: EncryptedU128,
) -> EncryptedBool {
    balance >= required
}

/// Compare two encrypted amounts
#[confidential_instruction]
pub fn compare_amounts(
    amount1: EncryptedU128,
    amount2: EncryptedU128,
) -> EncryptedBool {
    amount1 == amount2
}

