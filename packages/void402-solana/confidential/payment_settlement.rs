// Confidential instruction for x402 payment settlement
// This will be compiled by Arcium's Arcis compiler

use arcium_sdk::prelude::*;

/// Settle x402 payment
/// Verifies payment amount and transfers encrypted tokens
#[confidential_instruction]
pub fn settle_payment(
    payer_balance: EncryptedU128,     // Payer's encrypted balance
    payee_balance: EncryptedU128,     // Payee's encrypted balance
    requested_amount: EncryptedU128,  // Requested payment amount
    provided_amount: EncryptedU128,    // Provided payment amount
) -> (EncryptedU128, EncryptedU128, EncryptedBool) {
    // Verify amounts match
    let amounts_match = requested_amount == provided_amount;
    
    // Verify payer has sufficient balance
    let has_sufficient = payer_balance >= provided_amount;
    
    // If both conditions met, transfer
    let should_transfer = amounts_match && has_sufficient;
    
    let transfer_amount = if should_transfer {
        provided_amount
    } else {
        EncryptedU128::zero()
    };
    
    // Update balances
    let new_payer_balance = payer_balance - transfer_amount;
    let new_payee_balance = payee_balance + transfer_amount;
    
    (new_payer_balance, new_payee_balance, should_transfer)
}

/// Verify payment amount matches request
#[confidential_instruction]
pub fn verify_payment_amount(
    requested: EncryptedU128,
    provided: EncryptedU128,
) -> EncryptedBool {
    requested == provided
}

