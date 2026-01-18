/**
 * ChangeNow Service
 * Handles privacy mixing via ChangeNow.io API
 * Replaces Jupiter for true privacy (transactions are hidden)
 */

const CHANGENOW_API_KEY = process.env.CHANGENOW_API_KEY;
const CHANGENOW_BASE_URL = 'https://api.changenow.io/v1';
const MIXER_WITHDRAWAL_WALLET = process.env.MIXER_WITHDRAWAL_WALLET_ADDRESS;

// ChangeNow currency codes for Solana
const TOKEN_TO_CHANGENOW: Record<string, string> = {
  'SOL': 'sol',
  'USDC': 'usdcsol',
  'USDT': 'usdtsol',
};

// Minimum amount for ChangeNow (in smallest units)
const MIN_AMOUNTS: Record<string, bigint> = {
  'SOL': BigInt(3_000_000_000), // 3 SOL minimum
  'USDC': BigInt(3_000_000), // $3 USDC minimum
  'USDT': BigInt(3_000_000), // $3 USDT minimum
};

export interface ChangeNowTransaction {
  id: string;
  payoutAddress: string;
  payoutExtraId?: string;
  fromCurrency: string;
  toCurrency: string;
  amount: string;
  status: 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded' | 'expired';
  payinAddress?: string;
  payinExtraId?: string;
  payoutAddressHash?: string;
  fromAmount?: string;
  toAmount?: string;
  networkFee?: string;
  changenowFee?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangeNowResult {
  success: boolean;
  transactionId?: string;
  payinAddress?: string;
  payinExtraId?: string;
  error?: string;
}

export class ChangeNowService {
  /**
   * Check if ChangeNow is configured
   */
  isConfigured(): boolean {
    return !!(CHANGENOW_API_KEY && MIXER_WITHDRAWAL_WALLET);
  }

  /**
   * Get minimum amount for token
   */
  getMinimumAmount(token: 'SOL' | 'USDC' | 'USDT'): bigint {
    return MIN_AMOUNTS[token] || BigInt(0);
  }

  /**
   * Create a privacy exchange transaction
   * For privacy, we exchange same token (e.g., USDC → USDC) to break correlation
   */
  async createExchange(
    fromToken: 'SOL' | 'USDC' | 'USDT',
    toToken: 'SOL' | 'USDC' | 'USDT',
    amount: bigint, // Amount in smallest units (lamports for SOL, 1e6 for USDC/USDT)
    userId?: string
  ): Promise<ChangeNowResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ChangeNow not configured. Set CHANGENOW_API_KEY and MIXER_WITHDRAWAL_WALLET_ADDRESS',
      };
    }

    const fromCurrency = TOKEN_TO_CHANGENOW[fromToken];
    const toCurrency = TOKEN_TO_CHANGENOW[toToken];

    if (!fromCurrency || !toCurrency) {
      return {
        success: false,
        error: `Unsupported token: ${fromToken} or ${toToken}`,
      };
    }

    // Convert amount to decimal string
    const decimals = fromToken === 'SOL' ? 9 : 6;
    const amountDecimal = (Number(amount) / Math.pow(10, decimals)).toString();

    // Check minimum
    const minAmount = this.getMinimumAmount(fromToken);
    if (amount < minAmount) {
      return {
        success: false,
        error: `Amount ${amountDecimal} ${fromToken} is below minimum ${(Number(minAmount) / Math.pow(10, decimals)).toString()} ${fromToken}`,
      };
    }

    // Build transaction data (exactly like privacyusd)
    const transactionData: any = {
      from: fromCurrency,
      to: toCurrency,
      address: MIXER_WITHDRAWAL_WALLET,
      amount: amountDecimal,
    };

    // Add userId for tracking (like privacyusd)
    if (userId) {
      transactionData.userId = userId;
    }

    // Add contactEmail (like privacyusd)
    transactionData.contactEmail = '';

    // Note: ChangeNow doesn't support 'extraId' for SPL tokens (USDC/USDT) on Solana
    // Only native SOL supports extraId, so we don't include it for USDC/USDT (like privacyusd)

    try {
      const response = await fetch(`${CHANGENOW_BASE_URL}/transactions/${CHANGENOW_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PrivacyUSD/1.0', // Match privacyusd exactly
          'Accept': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const changenowData: any = await response.json();

      console.log(`🔒 PRIVACY MIXER: ChangeNow API response:`, JSON.stringify(changenowData, null, 2));

      if (!response.ok) {
        console.error(`❌ ChangeNow API error response:`, changenowData);
        return {
          success: false,
          error: `Privacy exchange API error: ${JSON.stringify(changenowData)}`,
        };
      }

      if (!changenowData.id) {
        console.error(`❌ ChangeNow response missing exchange ID:`, changenowData);
        return {
          success: false,
          error: `Privacy exchange API error: Missing exchange ID in response: ${JSON.stringify(changenowData)}`,
        };
      }

      // ChangeNow API might return 'payinAddress' or 'address' or 'depositAddress'
      const payinAddress = changenowData.payinAddress || changenowData.address || changenowData.depositAddress;
      
      if (!payinAddress) {
        console.error(`❌ ChangeNow response missing deposit address. Response:`, changenowData);
        return {
          success: false,
          error: `Privacy exchange API error: Missing deposit address in response. Available fields: ${Object.keys(changenowData).join(', ')}`,
        };
      }

      // Validate that the payinAddress is NOT the same as the withdrawal wallet
      if (payinAddress === MIXER_WITHDRAWAL_WALLET) {
        console.error(`❌ ChangeNow returned withdrawal wallet as deposit address! This is incorrect.`);
        return {
          success: false,
          error: `Privacy exchange API error: ChangeNow returned withdrawal wallet as deposit address`,
        };
      }

      console.log(`✅ ChangeNow exchange ${changenowData.id} created. Deposit address: ${payinAddress}`);
      console.log(`   Withdrawal address: ${MIXER_WITHDRAWAL_WALLET}`);
      console.log(`   Verifying addresses are different...`);

      // Success - return transaction details (exactly like privacyusd)
      return {
        success: true,
        transactionId: changenowData.id,
        payinAddress: payinAddress,
        payinExtraId: changenowData.payinExtraId,
      };
    } catch (error: any) {
      console.error(`❌ ChangeNow API error:`, error);
      return {
        success: false,
        error: `Failed to create ChangeNow exchange: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<ChangeNowTransaction | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${CHANGENOW_BASE_URL}/transactions/${CHANGENOW_API_KEY}/${transactionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data as ChangeNowTransaction;
    } catch {
      return null;
    }
  }

  /**
   * Estimate exchange (get expected output amount)
   */
  async estimateExchange(
    fromToken: 'SOL' | 'USDC' | 'USDT',
    toToken: 'SOL' | 'USDC' | 'USDT',
    amount: bigint
  ): Promise<{ success: boolean; estimatedOutput?: bigint; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'ChangeNow not configured',
      };
    }

    const fromCurrency = TOKEN_TO_CHANGENOW[fromToken];
    const toCurrency = TOKEN_TO_CHANGENOW[toToken];

    if (!fromCurrency || !toCurrency) {
      return {
        success: false,
        error: `Unsupported token: ${fromToken} or ${toToken}`,
      };
    }

    const decimals = fromToken === 'SOL' ? 9 : 6;
    const amountDecimal = (Number(amount) / Math.pow(10, decimals)).toString();

    try {
      const response = await fetch(
        `${CHANGENOW_BASE_URL}/exchange-amount/${amountDecimal}/${fromCurrency}_${toCurrency}?api_key=${CHANGENOW_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `ChangeNow estimate API error: ${response.status}`,
        };
      }

      const data: any = await response.json();
      const estimatedOutputDecimal = parseFloat(data.estimatedAmount || data.toAmount || '0');
      const outputDecimals = toToken === 'SOL' ? 9 : 6;
      const estimatedOutput = BigInt(Math.floor(estimatedOutputDecimal * Math.pow(10, outputDecimals)));

      return {
        success: true,
        estimatedOutput,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to estimate exchange: ${error.message || 'Unknown error'}`,
      };
    }
  }
}

// Singleton instance
let changenowServiceInstance: ChangeNowService | null = null;

export function getChangeNowService(): ChangeNowService {
  if (!changenowServiceInstance) {
    changenowServiceInstance = new ChangeNowService();
  }
  return changenowServiceInstance;
}
