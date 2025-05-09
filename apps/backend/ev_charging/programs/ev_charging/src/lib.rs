use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("FxdNFv8Avc2pXzFqiaJDwnda61u8tFfDvE4esAhG3RDg");

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

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.authority = ctx.accounts.authority.key();
        user.charge_count = 0;
        user.token_balance = 0;
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

    pub fn start_charge(
        ctx: Context<StartCharge>,
        amount: u64,                  // Total price in lamports
        tokens_used: u64,             // Number of tokens user wants to spend
        token_value_in_lamports: u64, // Value of one token in lamports (e.g., 0.25 SOL = 250_000_000)
    ) -> Result<()> {
        let user_token_acc = &ctx.accounts.user_reward_token_account;
        let owner_token_acc = &ctx.accounts.owner_reward_token_account;

        // Calculate total discount from tokens
        let discount = tokens_used
            .checked_mul(token_value_in_lamports)
            .ok_or(CustomError::Overflow)?;
        require!(discount <= amount, CustomError::InvalidDiscount);

        // Calculate remaining SOL amount after discount
        let amount_in_lamports = amount.checked_sub(discount).ok_or(CustomError::Underflow)?;

        msg!("Tokens used: {}", tokens_used);
        msg!("Token discount (lamports): {}", discount);
        msg!("SOL to pay (lamports): {}", amount_in_lamports);

        // If tokens_used > 0, transfer tokens from user to owner
        if tokens_used > 0 {
            require!(
                user_token_acc.amount >= tokens_used,
                CustomError::NotEnoughTokens
            );

            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: user_token_acc.to_account_info(),
                    to: owner_token_acc.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            );
            anchor_spl::token::transfer(cpi_ctx, tokens_used)?;
        }

        // Transfer SOL from user to escrow (if amount_in_lamports > 0)
        if amount_in_lamports > 0 {
            invoke(
                &system_instruction::transfer(
                    &ctx.accounts.authority.key(),
                    &ctx.accounts.escrow.key(),
                    amount_in_lamports,
                ),
                &[
                    ctx.accounts.authority.to_account_info(),
                    ctx.accounts.escrow.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // Mint reward token if eligible and user used no tokens this time
        if {
            let user = &ctx.accounts.user;
            user.charge_count >= 3 && tokens_used == 0
        } {
            token::mint_to(
                ctx.accounts.into_mint_to_user_context(),
                1, // Mint 1 token as reward
            )?;
        }

        // Update user state
        let user = &mut ctx.accounts.user;
        user.charge_count += 1;
        if user.charge_count >= 4 && tokens_used == 0 {
            user.token_balance += 1;
        }

        // Set escrow data
        let escrow = &mut ctx.accounts.escrow;
        escrow.user = ctx.accounts.user.key();
        escrow.owner = ctx.accounts.charger.owner;
        escrow.amount = amount_in_lamports;
        escrow.is_released = false;

        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>, amount: u64) -> Result<()> {
        // Transfer SOL from escrow to owner
        let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();
        let rent_exemption = Rent::get()?.minimum_balance(0);

        // Ensure escrow has sufficient balance
        require!(
            escrow_balance >= amount + rent_exemption,
            CustomError::InsufficientFunds
        );

        // Calculate actual transfer amount (ensuring the escrow account maintains rent-exemption)
        let transfer_amount = amount.min(escrow_balance - rent_exemption);

        // Get the actual owner from the escrow account
        let charger_owner = ctx.accounts.escrow.owner;

        // Find the charger owner's account among provided accounts
        let recipient_info = if ctx.accounts.authority.key() == charger_owner {
            // If the signer is the owner, use their account
            ctx.accounts.authority.to_account_info()
        } else {
            // If the signer is the user's authority, use the recipient_info (which should be the charger owner)
            ctx.accounts.recipient.to_account_info()
        };

        // Transfer SOL from escrow to the rightful owner (recipient)
        **ctx
            .accounts
            .escrow
            .to_account_info()
            .try_borrow_mut_lamports()? -= transfer_amount;
        **recipient_info.try_borrow_mut_lamports()? += transfer_amount;

        // Mark the escrow as released
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

    // Token accounts for reward tokens
    #[account(mut)]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner_reward_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    // Mint account for reward token
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> StartCharge<'info> {
    fn into_mint_to_user_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.reward_mint.to_account_info(),
            to: self.user_reward_token_account.to_account_info(),
            authority: self.mint_authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    // The user account from the escrow, needed to validate the relationship between the user PDA and authority
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump,
        constraint = user.key() == escrow.user @ CustomError::Unauthorized
    )]
    pub user: Account<'info, User>,

    // The signer, which can be either the charger owner or the user's authority
    #[account(
        mut,
        constraint = (
            authority.key() == escrow.owner || // Signer is charger owner
            authority.key() == user.authority // Signer is user's authority
        ) @ CustomError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// CHECK: This account is validated by the constraint that it must match the owner stored in the escrow
    #[account(mut, constraint = recipient.key() == escrow.owner @ CustomError::Unauthorized)]
    pub recipient: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 8, // discriminator + pubkey + u8 + u64
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
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

    #[msg("Escrow has already been released.")]
    EscrowAlreadyReleased,

    #[msg("Insufficient funds in the escrow account.")]
    InsufficientFunds,

    #[msg("Arithmetic overflow occurred")]
    Overflow,

    #[msg("Invalid discount amount")]
    InvalidDiscount,

    #[msg("Arithmetic underflow occurred")]
    Underflow,
}
