use anchor_lang::prelude::*;

// Declare the program ID (update with your deployed program ID)
declare_id!("5FyPMX3L9MZCgfBmrC42RmKv6qzs91e8KFtF2MHTJqbZ");

#[program]
pub mod ev_charging {
    use super::*;

    // Instruction to create a new Charger account
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
        price: f64,
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

    // Instruction to update an existing Charger account
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
        price: f64,
        connector_types: String,
    ) -> Result<()> {
        let charger = &mut ctx.accounts.charger;

        // Only owner can update
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
}

// Context for creating charger
#[derive(Accounts)]
#[instruction(
    name: String,
)]
pub struct CreateCharger<'info> {
    #[account(init, payer = payer, space = 8 + Charger::MAX_SIZE, seeds = [name.as_bytes()], bump)]
    pub charger: Account<'info, Charger>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Context for updating charger
#[derive(Accounts)]
pub struct UpdateCharger<'info> {
    #[account(mut, has_one = owner)]
    pub charger: Account<'info, Charger>,
    pub owner: Signer<'info>,
}

// Charger account data structure
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
    pub price: f64,
    pub connector_types: String,
}

impl Charger {
    // Calculate max size for account allocation (adjust string sizes as needed)
    pub const MAX_SIZE: usize = 32 + // owner Pubkey
        4 + 50 + // name (string prefix + max 50 chars)
        4 + 100 + // address
        4 + 50 + // city
        4 + 20 + // state
        4 + 10 + // zip
        4 + 200 + // description
        4 + 50 + // charger_type
        8 + // power (u64)
        8 + // price (f64)
        4 + 50; // connector_types
}

// Custom error for unauthorized access
#[error_code]
pub enum CustomError {
    #[msg("You are not authorized to update this charger.")]
    Unauthorized,
}
