use anchor_lang::prelude::*;

declare_id!("5hrjD5aKbAtgsj7ihucfc4HtxVigaJPhxTcCN7UQRLCE");

#[program]
pub mod ev_charging {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
