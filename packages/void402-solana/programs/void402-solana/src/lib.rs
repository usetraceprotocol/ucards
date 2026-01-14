use anchor_lang::prelude::*;

declare_id!("9noidxW4NTm7hgdFY8k8aNu6Qfv3yg6mryQaTp31jjcG");

#[program]
pub mod void402_solana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
