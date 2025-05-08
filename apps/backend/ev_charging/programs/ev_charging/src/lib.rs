use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("GtyfWTKPqd8V8zqid5nfJKa79DivNkNz7NyXsUKCPjSF");

#[program]
pub mod ev_charging {
    use super::*;

    pub fn create_charger(
        ctx: Context<CreateCharger>,
        name: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        description: String,
        charger_type: String,
        power: u64,
        price: u64,
        connector_types: String,
    ) -> Result<()> {
        let charger = &mut ctx.accounts.charger;

        charger.owner = *ctx.accounts.payer.key;
        charger.name = name;
        charger.address = address;
        charger.city = city;
        charger.state = state;
        charger.zip = zip;
        charger.description = description;
        charger.charger_type = charger_type;
        charger.power = power;
        charger.price = price;
        charger.connector_types = connector_types;

        Ok(())
    }

    pub fn update_charger(
        ctx: Context<UpdateCharger>,
        name: String,
        address: String,
        city: String,
        state: String,
        zip: String,
        description: String,
        charger_type: String,
        power: u64,
        price: u64,
        connector_types: String,
    ) -> Result<()> {
        let charger = &mut ctx.accounts.charger;

        require_keys_eq!(
            charger.owner,
            ctx.accounts.owner.key(),
            CustomError::Unauthorized
        );

        charger.name = name;
        charger.address = address;
        charger.city = city;
        charger.state = state;
        charger.zip = zip;
        charger.description = description;
        charger.charger_type = charger_type;
        charger.power = power;
        charger.price = price;
        charger.connector_types = connector_types;

        Ok(())
    }

    pub fn start_charge(ctx: Context<StartCharge>, amount: u64, use_token: bool) -> Result<()> {
        let mut amount = amount;
        let user_token_acc = &ctx.accounts.user_reward_token_account;
        let owner_token_acc = &ctx.accounts.owner_reward_token_account;

        // If user chooses to use a token and has at least 1, apply 50% discount and transfer token to owner
        if use_token {
            require!(user_token_acc.amount >= 1, CustomError::NotEnoughTokens);

            // Reduce fee by 50%
            amount = amount / 2;

            // Transfer 1 reward token from user to owner
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_acc.to_account_info(),
                    to: owner_token_acc.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            );
            anchor_spl::token::transfer(cpi_ctx, 1)?;
        }

        // Transfer user's funds to escrow (if amount > 0)
        if amount > 0 {
            token::transfer(ctx.accounts.into_transfer_to_escrow_context(), amount)?;
        }

        // If user is eligible for a reward token and not using token this time, mint before mutably borrowing user
        if {
            // We need to check the charge count before incrementing it, so temporarily borrow user as immutable
            let user = &ctx.accounts.user;
            user.charge_count > 3 && !use_token
        } {
            token::mint_to(
                ctx.accounts.into_mint_to_user_context(),
                1, // Mint 1 token as reward
            )?;
        }

        // Now mutably borrow user and update fields
        let user = &mut ctx.accounts.user;
        user.charge_count += 1;
        if user.charge_count > 3 && !use_token {
            user.token_balance += 1;
        }

        // Set escrow data
        let escrow = &mut ctx.accounts.escrow;
        escrow.user = ctx.accounts.user.key();
        escrow.owner = ctx.accounts.charger.owner;
        escrow.amount = amount;
        escrow.is_released = false;

        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>, amount: u64) -> Result<()> {
        // Here you should check that 80% of charging is done (add your own logic)
        // For now, we allow release directly

        token::transfer(ctx.accounts.into_transfer_to_owner_context(), amount)?;
        ctx.accounts.escrow.is_released = true;
        Ok(())
    }
}

// --- Contexts ---

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateCharger<'info> {
    #[account(init, payer = payer, space = 8 + Charger::MAX_SIZE, seeds = [name.as_bytes()], bump)]
    pub charger: Account<'info, Charger>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCharger<'info> {
    #[account(mut, has_one = owner)]
    pub charger: Account<'info, Charger>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct StartCharge<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(init, payer = authority, space = 8 + Escrow::MAX_SIZE)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub charger: Account<'info, Charger>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    // Mint account for reward token
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_reward_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_reward_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> StartCharge<'info> {
    fn into_transfer_to_escrow_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.user_token_account.to_account_info(),
            to: self.escrow_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    fn into_mint_to_user_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.reward_mint.to_account_info(),
            to: self.user_reward_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub authority: Signer<'info>,
}

impl<'info> ReleaseEscrow<'info> {
    fn into_transfer_to_owner_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_token_account.to_account_info(),
            to: self.owner_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

// --- Accounts ---

#[account]
pub struct Charger {
    pub owner: Pubkey,
    pub name: String,
    pub address: String,
    pub city: String,
    pub state: String,
    pub zip: String,
    pub description: String,
    pub charger_type: String,
    pub power: u64,
    pub price: u64,
    pub connector_types: String,
}

impl Charger {
    pub const MAX_SIZE: usize =
        32 + 4 + 50 + 4 + 100 + 4 + 50 + 4 + 20 + 4 + 10 + 4 + 200 + 4 + 50 + 8 + 8 + 4 + 50;
}

#[account]
pub struct User {
    pub authority: Pubkey,
    pub charge_count: u8,
    pub token_balance: u64,
}

#[account]
pub struct Escrow {
    pub user: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub is_released: bool,
}

impl Escrow {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 1;
}

// --- Errors ---

#[error_code]
pub enum CustomError {
    #[msg("You are not authorized to update this charger.")]
    Unauthorized,
    #[msg("Not enough reward tokens.")]
    NotEnoughTokens,
}
