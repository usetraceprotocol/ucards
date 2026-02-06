/**
 * Solana utilities for Void402 ZK integration
 * Handles connection, PDA derivation for mainnet
 * 1:1 with Nolvipay's nolvi-solana.ts
 */

import { 
  Connection, 
  PublicKey, 
  SystemProgram,
} from '@solana/web3.js';

// Use mainnet for production (can override with environment variable)
export function getSolanaConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

// Void402 ZK Proof Program ID
// Default: Our own deployment on mainnet
// Can override with VOID402_PROGRAM_ID environment variable
export const VOID402_PROGRAM_ID = new PublicKey(
  process.env.VOID402_PROGRAM_ID || process.env.NOLVI_PAY_PROGRAM_ID || '4VBEvYSEFBr7B3b6ahgUdMnR9hPZLnZJy6rHVM8kcMsn'
);

/**
 * Derive Pool PDA
 */
export async function derivePoolPDA(tokenMint: string): Promise<PublicKey> {
  const actualTokenMint = tokenMint === 'Native' || tokenMint === 'SOL'
    ? 'So11111111111111111111111111111111111111112' 
    : tokenMint;
  const tokenMintPubkey = new PublicKey(actualTokenMint);
  
  const seeds = [
    Buffer.from('pool'),
    tokenMintPubkey.toBuffer(),
  ];
  
  const [poolPDA] = PublicKey.findProgramAddressSync(
    seeds,
    VOID402_PROGRAM_ID
  );
  
  return poolPDA;
}

/**
 * Derive User Balance PDA
 */
export async function deriveUserBalancePDA(walletAddress: string, tokenMint: string): Promise<PublicKey> {
  const walletPubkey = new PublicKey(walletAddress);
  
  const actualTokenMint = tokenMint === 'Native' || tokenMint === 'SOL'
    ? 'So11111111111111111111111111111111111111112' 
    : tokenMint;
  const tokenMintPubkey = new PublicKey(actualTokenMint);
  
  const seeds = [
    Buffer.from('user_balance'),
    walletPubkey.toBuffer(),
    tokenMintPubkey.toBuffer(),
  ];
  
  const [balancePDA] = PublicKey.findProgramAddressSync(
    seeds,
    VOID402_PROGRAM_ID
  );
  
  return balancePDA;
}

/**
 * Derive Proof PDA
 */
export async function deriveProofPDA(nonce: number): Promise<PublicKey> {
  const nonceBuffer = Buffer.allocUnsafe(8);
  const nonceBigInt = BigInt(nonce);
  for (let i = 0; i < 8; i++) {
    nonceBuffer[i] = Number((nonceBigInt >> BigInt(i * 8)) & BigInt(0xff));
  }
  
  const seeds = [
    Buffer.from('proof'),
    nonceBuffer,
  ];
  
  const [proofPDA] = PublicKey.findProgramAddressSync(
    seeds,
    VOID402_PROGRAM_ID
  );
  
  return proofPDA;
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
