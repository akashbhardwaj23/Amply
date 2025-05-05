use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    program::{invoke_signed},
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};

// Charger Struct
#[derive(BorshSerialize, BorshDeserialize, Debug)]
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

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    // Account definitions
    let payer = next_account_info(accounts_iter)?;
    let charger_account = next_account_info(accounts_iter)?;
    let system_program_account = next_account_info(accounts_iter)?;

    // Instruction type: 0 = Create, 1 = Update
    let (instruction_type, data) = input_data.split_first().ok_or(ProgramError::InvalidInstructionData)?;

    if *instruction_type == 0 {
        // Create a new charger
        let mut charger: Charger = Charger::try_from_slice(data).map_err(|_| ProgramError::InvalidInstructionData)?;

        // Validate PDA for the charger account
        let (pda, bump_seed) = Pubkey::find_program_address(
            &[charger.name.as_bytes()],
            program_id,
        );
        if pda != *charger_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        // Rent calculation for the charger account
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(std::mem::size_of::<Charger>());

        let create_account_ix = system_instruction::create_account(
            payer.key,
            charger_account.key,
            rent_lamports,
            std::mem::size_of::<Charger>() as u64,
            program_id,
        );

        invoke_signed(
            &create_account_ix,
            &[payer.clone(), charger_account.clone(), system_program_account.clone()],
            &[&[charger.name.as_bytes(), &[bump_seed]]],
        )?;

        // Set owner as the payer's public key
        charger.owner = *payer.key;

        // Serialize charger data into the charger account
        charger.serialize(&mut &mut charger_account.data.borrow_mut()[..])?;
        msg!("Charger created successfully: {:?}", charger);
    } else if *instruction_type == 1 {
        // Update an existing charger
        let mut charger = Charger::try_from_slice(&charger_account.data.borrow()).map_err(|_| ProgramError::InvalidAccountData)?;

        // Ensure only the owner can update the charger
        if charger.owner != *payer.key {
            return Err(ProgramError::IllegalOwner);
        }

        // Deserialize update data
        let updated_charger: Charger = Charger::try_from_slice(data).map_err(|_| ProgramError::InvalidInstructionData)?;

        // Update all mutable fields
        charger.name = updated_charger.name;
        charger.address = updated_charger.address;
        charger.city = updated_charger.city;
        charger.state = updated_charger.state;
        charger.zip = updated_charger.zip;
        charger.description = updated_charger.description;
        charger.charger_type = updated_charger.charger_type;
        charger.power = updated_charger.power;
        charger.price = updated_charger.price;
        charger.connector_types = updated_charger.connector_types;

        // Serialize updated charger data back into the account
        charger.serialize(&mut &mut charger_account.data.borrow_mut()[..])?;
        msg!("Charger updated successfully: {:?}", charger);
    } else {
        return Err(ProgramError::InvalidInstructionData);
    }

    Ok(())
}
