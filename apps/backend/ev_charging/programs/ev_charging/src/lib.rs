use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, rent::Rent, system_instruction};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("YehhGH97KftZVcMQX1TB17guVGVUwTYK4PZmoHTfSpv");

pub const MINT_AUTHORITY_SEED: &[u8] = b"mint-authority";

#[program]
pub mod ev_charging {
    use super::*;

    pub fn initialize_reward_mint(_ctx: Context<InitializeRewardMint>) -> Result<()> {
        msg!("Reward mint initialized with program PDA as mint authority");
        Ok(())
    }

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
        latitude: f64,
        longitude: f64,
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
        charger.latitude = latitude;
        charger.longitude = longitude;
        Ok(())
    }

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.authority = ctx.accounts.authority.key();
        user.charge_count = 0;
        user.token_balance = 0;
        user.total_power_consumed = 0;
        user.total_price_paid = 0;
        user.total_sessions = 0;
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
        latitude: f64,
        longitude: f64,
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
        charger.longitude = longitude;
        charger.latitude = latitude;
        Ok(())
    }

    pub fn start_charge(
    ctx: Context<StartCharge>,
    amount: u64,
    use_token: bool,
    mint_authority_bump: u8,
    session_id: u64,
) -> Result<()> {
    msg!("Seed 1: {:?}", b"escrow");
    msg!("Seed 2: {:?}", ctx.accounts.authority.key());
    msg!("Seed 3: {:?}", ctx.accounts.charger.key());
    msg!("Seed 4: {:?}", session_id.to_le_bytes());

    let mut amount_in_lamports = amount;
    let user_token_acc = &ctx.accounts.user_reward_token_account;
    let owner_token_acc = &ctx.accounts.owner_reward_token_account;

    // If paying with tokens, transfer 1 token (in base units) from user to owner
    if use_token {
        require!(user_token_acc.amount >= 1, CustomError::NotEnoughTokens);
        // amount_in_lamports = amount_in_lamports * 75 / 100;
        let discount = 100_000_000u64;
        if amount_in_lamports > discount {
            amount_in_lamports -= discount;
        }else {
            amount_in_lamports = 0;
        }
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

    // Transfer lamports to escrow if needed
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

    // Increment the user's charge count FIRST
    let user = &mut ctx.accounts.user;
    user.charge_count += 1;

    // Only mint a token on every 4th charge (i.e., 4,8,12,...)
    if user.charge_count % 4 == 0 && !use_token {
        let seeds = &[MINT_AUTHORITY_SEED, &[mint_authority_bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.reward_mint.to_account_info(),
            to: ctx.accounts.user_reward_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority_pda.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        // Mint 1 whole token (not 1 base unit)
        let decimals = ctx.accounts.reward_mint.decimals;
        let amount = 10u64.pow(decimals as u32);
        token::mint_to(cpi_ctx, amount)?;

        user.token_balance += 1;
    }

    // Update escrow account
    let escrow = &mut ctx.accounts.escrow;
    escrow.user = ctx.accounts.user.key();
    escrow.owner = ctx.accounts.charger.owner;
    escrow.amount = amount_in_lamports;
    escrow.is_released = false;

    Ok(())
}


    pub fn release_escrow(ctx: Context<ReleaseEscrow>, amount: u64) -> Result<()> {
        let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();
        let rent_exemption = Rent::get()?.minimum_balance(0);

        require!(
            escrow_balance >= amount + rent_exemption,
            CustomError::InsufficientFunds
        );

        let transfer_amount = amount.min(escrow_balance - rent_exemption);
        let charger_owner = ctx.accounts.escrow.owner;

        let recipient_info = if ctx.accounts.authority.key() == charger_owner {
            ctx.accounts.authority.to_account_info()
        } else {
            ctx.accounts.recipient.to_account_info()
        };

        **ctx
            .accounts
            .escrow
            .to_account_info()
            .try_borrow_mut_lamports()? -= transfer_amount;
        **recipient_info.try_borrow_mut_lamports()? += transfer_amount;

        ctx.accounts.escrow.is_released = true;
        Ok(())
    }

    // NEW: Record a charging session and update user stats
    pub fn record_charging_session(
        ctx: Context<RecordChargingSession>,
        charger_name: String,
        power: u64,
        price_paid: u64,
        minutes: u32,
        timestamp: i64,
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        session.user = ctx.accounts.authority.key();
        session.charger = ctx.accounts.charger.key();
        session.charger_name = charger_name;
        session.power = power;
        session.price_paid = price_paid;
        session.minutes = minutes;
        session.timestamp = timestamp;

        let user = &mut ctx.accounts.user;
        user.total_power_consumed += power;
        user.total_price_paid += price_paid;
        user.total_sessions += 1;

        Ok(())
    }
}

// --- Contexts ---

#[derive(Accounts)]
pub struct InitializeRewardMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint_authority_pda,
    )]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        seeds = [MINT_AUTHORITY_SEED],
        bump,
    )]
    /// CHECK: This is a PDA owned by the program that will be the mint authority
    pub mint_authority_pda: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

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
#[instruction(amount: u64, use_token: bool, mint_authority_bump: u8, session_id: u64)]
pub struct StartCharge<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(
    init_if_needed,
    payer = authority,
    space = 8 + Escrow::MAX_SIZE,
    seeds = [b"escrow", authority.key().as_ref(), charger.key().as_ref(),&session_id.to_le_bytes()],
    bump
)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub charger: Account<'info, Charger>,
    #[account(mut)]
    pub user_reward_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_reward_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        seeds = [MINT_AUTHORITY_SEED],
        bump = mint_authority_bump
    )]
    /// CHECK: This is a PDA owned by the program that is the mint authority
    pub mint_authority_pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump,
        constraint = user.key() == escrow.user @ CustomError::Unauthorized
    )]
    pub user: Account<'info, User>,
    #[account(
        mut,
        constraint = (
            authority.key() == escrow.owner ||
            authority.key() == user.authority
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
        space = 8 + User::MAX_SIZE,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// NEW: Context for recording a charging session
#[derive(Accounts)]
#[instruction(charger_name: String, power: u64, price_paid: u64, minutes: u32, timestamp: i64)]
pub struct RecordChargingSession<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ChargingSession::MAX_SIZE,
        seeds = [
            b"session",
            authority.key().as_ref(),
            &timestamp.to_le_bytes()
        ],
        bump
    )]
    pub session: Account<'info, ChargingSession>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account()]
    pub charger: Account<'info, Charger>,
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
    pub latitude: f64,
    pub longitude: f64,
}

impl Charger {
    pub const MAX_SIZE: usize = 32
        + 4
        + 50
        + 4
        + 100
        + 4
        + 50
        + 4
        + 20
        + 4
        + 10
        + 4
        + 200
        + 4
        + 50
        + 8
        + 8
        + 4
        + 50
        + 8
        + 8;
}

#[account]
pub struct User {
    pub authority: Pubkey,
    pub charge_count: u8,
    pub token_balance: u64,
    pub total_power_consumed: u64,
    pub total_price_paid: u64,
    pub total_sessions: u32,
}

impl User {
    pub const MAX_SIZE: usize = 32 + 1 + 8 + 8 + 8 + 4;
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

// NEW: Account for charging session history
#[account]
pub struct ChargingSession {
    pub user: Pubkey,
    pub charger: Pubkey,
    pub charger_name: String,
    pub power: u64,
    pub price_paid: u64,
    pub minutes: u32,
    pub timestamp: i64,
}

impl ChargingSession {
    // 32 + 32 + 4 + 50 + 8 + 8 + 4 + 8 = 146
    pub const MAX_SIZE: usize = 32 + 32 + 4 + 50 + 8 + 8 + 4 + 8;
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
}
