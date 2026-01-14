# Void402 Solana Programs

Solana programs for Void402 with Arcium MPC integration.

## Programs

### void-token
Encrypted SPL Token program with Arcium MPC for confidential balances and transfers.

### void-facilitator
x402 Payment Facilitator program for encrypted payment processing.

## Setup

### Prerequisites
- Solana CLI installed
- Anchor framework installed
- Rust toolchain

### Installation

```bash
# Install dependencies
anchor build
```

### Configuration

Create `.env` file:
```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json
ARCIUM_CLUSTER_PUBKEY=<your_arcium_cluster_pubkey>
```

## Development

### Build Programs
```bash
anchor build
```

### Test
```bash
anchor test
```

### Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet
```bash
anchor deploy --provider.cluster mainnet
```

## Arcium Integration

These programs use Arcium MPC for encrypted computations:
- Encrypted balance operations
- Encrypted transfers
- Payment verification

See [Arcium Documentation](https://docs.arcium.com) for details.

## Program IDs

After deployment, save the program IDs:
- `TOKEN_PROGRAM_ID` - void-token program ID
- `FACILITATOR_PROGRAM_ID` - void-facilitator program ID

Update backend `.env` with these IDs.

