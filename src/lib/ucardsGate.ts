import { createPublicClient, http, erc20Abi, formatUnits, parseUnits } from "viem";
import { mainnet } from "viem/chains";

const TOKEN_ADDRESS = import.meta.env.VITE_UCARDS_TOKEN_ADDRESS as `0x${string}` | undefined;
const MIN_BALANCE_RAW = import.meta.env.VITE_UCARDS_MIN_BALANCE ?? "100";
const RPC_URL = import.meta.env.VITE_UCARDS_RPC_URL ?? "https://eth.merkle.io";

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
});

export interface GateResult {
  configured: boolean;
  hasAccess: boolean;
  balance: string;
  required: string;
  symbol: string;
  tokenAddress: string | null;
  reason?: string;
}

export async function checkUCardsBalance(walletAddress: string): Promise<GateResult> {
  if (!TOKEN_ADDRESS || TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return {
      configured: false,
      hasAccess: true,
      balance: "0",
      required: MIN_BALANCE_RAW,
      symbol: "UCARD",
      tokenAddress: null,
      reason: "Pre-launch demo — token not yet deployed, dashboard open to all connected wallets.",
    };
  }

  try {
    const [decimals, balance, symbol] = await Promise.all([
      client.readContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      }),
      client.readContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "symbol",
      }).catch(() => "UCARD"),
    ]);

    const required = parseUnits(MIN_BALANCE_RAW, decimals);
    const human = formatUnits(balance, decimals);

    return {
      configured: true,
      hasAccess: balance >= required,
      balance: human,
      required: MIN_BALANCE_RAW,
      symbol,
      tokenAddress: TOKEN_ADDRESS,
    };
  } catch (err) {
    return {
      configured: true,
      hasAccess: false,
      balance: "0",
      required: MIN_BALANCE_RAW,
      symbol: "UCARD",
      tokenAddress: TOKEN_ADDRESS,
      reason: err instanceof Error ? err.message : "Failed to read on-chain balance",
    };
  }
}
