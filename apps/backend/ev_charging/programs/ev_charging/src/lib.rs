use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("BzyxNcedD9nnqVD34p2maBDEWfrvn6s618zreFQwrPyJ");

// Constants for finding the mint authority PDA
pub const MINT_AUTHORITY_SEED: &[u8] = b"mint-authority";

#[program]
pub mod ev_charging {
    use super::*;

    // Initialize the reward token mint with program's PDA as the mint authority
    pub fn initialize_reward_mint(_ctx: Context<InitializeRewardMint>) -> Result<()> {
        // No additional logic needed - the account constraints in the context
        // will set up the mint with the correct authority
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
        latitude: f64, // New parameter
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
        charger.latitude = latitude; // Store new field
        charger.longitude = longitude; // Store new field

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
        latitude: f64,  // New parameter
        longitude: f64, // New parameter
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

    pub fn start_charge(ctx: Context<StartCharge>, amount: u64, use_token: bool, mint_authority_bump: u8) -> Result<()> {
        let mut amount_in_lamports = amount;
        let user_token_acc = &ctx.accounts.user_reward_token_account;
        let owner_token_acc = &ctx.accounts.owner_reward_token_account;

        // If user chooses to use a token and has at least 1, apply 50% discount
        if use_token {
            require!(user_token_acc.amount >= 1, CustomError::NotEnoughTokens);

            // Reduce fee by 25%
            amount_in_lamports = amount_in_lamports * 75 / 100;

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

        // Transfer SOL from user to escrow (if amount > 0)
        if amount_in_lamports > 0 {
            // Transfer SOL from user to the escrow PDA
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

        // If user is eligible for a reward token and not using token this time, mint before mutably borrowing user
        if {
            // We need to check the charge count before incrementing it, so temporarily borrow user as immutable
            let user = &ctx.accounts.user;
            user.charge_count >= 3 && !use_token
        } {
            // Use the mint authority PDA to sign for minting tokens through CPI
            let seeds = &[MINT_AUTHORITY_SEED, &[mint_authority_bump]];
            let signer_seeds = &[&seeds[..]];
            
            // Mint the token to the user's reward token account
            let cpi_accounts = MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.user_reward_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority_pda.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
            token::mint_to(cpi_ctx, 1)?;
        }

        // Now mutably borrow user and update fields
        let user = &mut ctx.accounts.user;
        user.charge_count += 1;
        if user.charge_count >= 4 && !use_token {
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
#[instruction(amount: u64, use_token: bool, mint_authority_bump: u8)]
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
    
    // PDA that has mint authority
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
    pub latitude: f64,  // New field
    pub longitude: f64, // New field
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
}
