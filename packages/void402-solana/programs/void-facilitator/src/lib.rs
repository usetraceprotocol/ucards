use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;

// Token-2022 Program ID
const TOKEN_2022_PROGRAM_ID: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

declare_id!("4pg7ro6Ds64oFajymEEhTRFA6sEqghrMmhRgUcmoj1cu");

#[program]
pub mod void_facilitator {
    use super::*;

    /// Create x402 payment request
    /// Amount is handled by Token-2022 confidential transfers
    pub fn create_payment_request(
        ctx: Context<CreatePaymentRequest>,
        payment_id: [u8; 32],
        amount: u64, // Amount (will be encrypted by Token-2022)
        payment_hash: [u8; 32],
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment_request;
        payment.payer = ctx.accounts.payer.key();
        payment.payee = ctx.accounts.payee.key();
        payment.payment_id = payment_id;
        payment.payment_hash = payment_hash;
        payment.timestamp = Clock::get()?.unix_timestamp;
        payment.settled = false;
        payment.bump = ctx.bumps.payment_request;

        emit!(PaymentRequested {
            payment_id,
            payer: payment.payer,
            payee: payment.payee,
            timestamp: payment.timestamp,
        });

        Ok(())
    }

    /// Settle x402 payment using Token-2022 confidential transfers
    /// The actual transfer is handled by Token-2022 program
    pub fn settle_payment(
        ctx: Context<SettlePayment>,
        payment_id: [u8; 32],
        amount: u64, // Amount (handled by Token-2022)
        payment_hash: [u8; 32],
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment_request;
        
        require!(!payment.settled, ErrorCode::PaymentAlreadySettled);
        require!(
            payment.payment_hash == payment_hash,
            ErrorCode::InvalidPaymentHash
        );

        // Token-2022 handles the confidential transfer
        // The actual transfer instruction should be included in the transaction
        // This function just marks the payment as settled

        payment.settled = true;

        emit!(PaymentSettled {
            payment_id,
            payer: payment.payer,
            payee: payment.payee,
        });

        Ok(())
    }

    /// Verify payment request exists
    pub fn verify_payment_request(
        ctx: Context<VerifyPaymentRequest>,
    ) -> Result<()> {
        let payment = &ctx.accounts.payment_request;
        
        msg!(
            "Payment verified - Payer: {}, Payee: {}, Settled: {}",
            payment.payer,
            payment.payee,
            payment.settled
        );

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(payment_id: [u8; 32])]
pub struct CreatePaymentRequest<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + PaymentRequest::LEN,
        seeds = [b"payment_request", payment_id.as_ref()],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Payee can be any account
    pub payee: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_id: [u8; 32])]
pub struct SettlePayment<'info> {
    #[account(
        mut,
        seeds = [b"payment_request", payment_id.as_ref()],
        bump = payment_request.bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,
    
    /// CHECK: Payer verification happens in Arcium computation
    pub payer: AccountInfo<'info>,
    
    /// CHECK: Payee from payment request
    pub payee: AccountInfo<'info>,
    
    /// CHECK: Token-2022 program for confidential transfers
    pub token_2022_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
#[instruction(payment_id: [u8; 32])]
pub struct VerifyPaymentRequest<'info> {
    #[account(
        seeds = [b"payment_request", payment_id.as_ref()],
        bump = payment_request.bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,
}

#[account]
pub struct PaymentRequest {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub payment_id: [u8; 32],
    pub payment_hash: [u8; 32],
    pub timestamp: i64,
    pub settled: bool,
    pub bump: u8,
}

impl PaymentRequest {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 1 + 1; // All fields + discriminator + bump
}

#[event]
pub struct PaymentRequested {
    pub payment_id: [u8; 32],
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PaymentSettled {
    pub payment_id: [u8; 32],
    pub payer: Pubkey,
    pub payee: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Payment already settled")]
    PaymentAlreadySettled,
    #[msg("Invalid payment hash")]
    InvalidPaymentHash,
    #[msg("Payment request not found")]
    PaymentNotFound,
    #[msg("Token-2022 transfer failed")]
    Token2022TransferFailed,
}
