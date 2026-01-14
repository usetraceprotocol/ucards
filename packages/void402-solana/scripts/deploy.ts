import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env") });

async function main() {
  console.log("Deploying Void402 Solana programs...");

  // Load keypair
  const payerKeypairPath = process.env.SOLANA_KEYPAIR_PATH || join(process.env.HOME || "", ".config/solana/id.json");
  let payer: Keypair;
  
  try {
    const keypairData = JSON.parse(readFileSync(payerKeypairPath, "utf-8"));
    payer = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  } catch (error) {
    console.error("Failed to load keypair. Please set SOLANA_KEYPAIR_PATH in .env");
    console.error("Or ensure ~/.config/solana/id.json exists");
    process.exit(1);
  }

  console.log("Deploying with account:", payer.publicKey.toBase58());

  // Get RPC URL
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  // Check balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log("Account balance:", balance / anchor.web3.LAMPORTS_PER_SOL, "SOL");

  if (balance < 0.1 * anchor.web3.LAMPORTS_PER_SOL) {
    console.warn("⚠️  Low balance! You may need SOL for deployment.");
    console.warn("Get testnet SOL from: https://faucet.solana.com/");
  }

  // TODO: Deploy programs using Anchor
  // This would use:
  // anchor deploy --provider.cluster devnet --provider.wallet <keypair>
  
  console.log("\n=== Deployment Instructions ===");
  console.log("To deploy programs, run:");
  console.log("  cd packages/void402-solana");
  console.log("  anchor build");
  console.log("  anchor deploy --provider.cluster devnet");
  console.log("\nAfter deployment, save the program IDs and update .env:");
  console.log("  TOKEN_PROGRAM_ID=<deployed_token_program_id>");
  console.log("  FACILITATOR_PROGRAM_ID=<deployed_facilitator_program_id>");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

