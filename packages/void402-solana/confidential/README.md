# Arcium Confidential Instructions

These are the confidential instructions that will be compiled by Arcium's Arcis compiler and executed using MPC.

## Instructions

### encrypted_transfer.rs
- Verifies encrypted balance is sufficient
- Performs encrypted transfer
- Updates sender and recipient balances

### payment_settlement.rs
- Verifies payment amount matches request
- Checks payer has sufficient balance
- Settles payment by transferring tokens

## Compilation

These instructions need to be compiled using Arcium's CLI:

```bash
arcium compile confidential/encrypted_transfer.rs
arcium compile confidential/payment_settlement.rs
```

## Integration

After compilation, these instructions are:
1. Deployed to Arcium network
2. Referenced in Solana programs
3. Called via Arcium SDK from backend

See [Arcium Documentation](https://docs.arcium.com) for details.

