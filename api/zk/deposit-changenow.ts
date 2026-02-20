/**
 * Void402 Privacy Mixer Deposit API (1:1 with Nolvipay)
 * POST /api/zk/deposit-changenow
 * 
 * Creates a Privacy Mixer exchange for enhanced privacy.
 * User sends funds to the mixer, which anonymizes the transaction.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { extractBearerToken, verifyBearerToken } from '../lib/bearer-auth.js';

const CHANGENOW_API_KEY = process.env.CHANGENOW_API_KEY;
const CHANGENOW_BASE_URL = 'https://api.changenow.io/v1';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Map tokens to ChangeNow.io currency codes - chain-aware
import { getChangeNowCurrencies } from '../lib/chain-config.js';

function getTokenToChangeNow(): Record<string, string> {
  return getChangeNowCurrencies() as Record<string, string>;
}

// Legacy alias for backward compatibility
const TOKEN_TO_CHANGENOW = getTokenToChangeNow();

const ALLOWED_ORIGINS = [
  "https://void402.com",
  "https://www.void402.com",
  "https://orb402.com",
  "https://www.orb402.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getAllowedOrigin(origin: string | undefined): string {
  if (!origin) return "https://www.void402.com";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.match(/^https:\/\/code-whisperer-33[\w-]*\.vercel\.app/)) return origin;
  return "https://www.void402.com";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { wallet, amount, token } = req.body;

    if (!wallet || !amount || !token) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        message: 'wallet, amount, and token are required' 
      });
    }

    if (!['USDC', 'USDT'].includes(token)) {
      return res.status(400).json({ 
        error: 'Invalid token',
        message: 'Token must be USDC or USDT' 
      });
    }

    // Require bearer token authentication
    const bearerToken = extractBearerToken(req);
    if (!bearerToken) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Bearer token is required'
      });
    }

    const tokenVerification = await verifyBearerToken(bearerToken, wallet);
    if (!tokenVerification.valid) {
      return res.status(403).json({ 
        error: 'Invalid authentication',
        message: tokenVerification.error || 'Bearer token is invalid'
      });
    }

    if (!CHANGENOW_API_KEY) {
      return res.status(500).json({ 
        error: 'Privacy Mixer not configured',
        message: 'CHANGENOW_API_KEY environment variable not set' 
      });
    }

    const mixerWithdrawalAddress = process.env.MIXER_WITHDRAWAL_WALLET_ADDRESS;
    if (!mixerWithdrawalAddress) {
      return res.status(500).json({ 
        error: 'Privacy Mixer not configured',
        message: 'MIXER_WITHDRAWAL_WALLET_ADDRESS not set' 
      });
    }

    const fromCurrency = TOKEN_TO_CHANGENOW[token];
    const toCurrency = TOKEN_TO_CHANGENOW[token];

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({ 
        error: 'Unsupported token',
        message: `${token} is not supported` 
      });
    }

    console.log(`🔒 PRIVACY MIXER: Creating exchange for ${amount} ${token} from ${wallet}`);

    const transactionData: any = {
      from: fromCurrency,
      to: toCurrency,
      address: mixerWithdrawalAddress,
      amount: amount,
      extraId: wallet,
    };

    const response = await fetch(`${CHANGENOW_BASE_URL}/transactions/${CHANGENOW_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Void402/1.0',
        'Accept': 'application/json',
        'x-forwarded-for': req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || '0.0.0.0',
      },
      body: JSON.stringify(transactionData),
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Privacy Mixer returned non-JSON response:', text);
      return res.status(500).json({
        error: 'Invalid response from Privacy Mixer',
        message: text || 'API returned non-JSON response'
      });
    }

    if (!response.ok) {
      console.error('Privacy Mixer API error:', data);
      return res.status(response.status).json({
        error: 'Privacy Mixer API error',
        message: data.message || data.error || 'Failed to create exchange',
      });
    }

    console.log(`✅ PRIVACY MIXER: Exchange created - ID: ${data.id}`);

    // Store the exchange ID in database
    if (supabase && data.id) {
      try {
        const { data: existingMapping } = await supabase
          .from('zk_user_wallets')
          .select('*')
          .eq('user_wallet', wallet)
          .eq('token', token)
          .maybeSingle();

        if (existingMapping) {
          await supabase
            .from('zk_user_wallets')
            .update({
              mixer_exchange_id: data.id,
              mixer_deposit_address: data.payinAddress || data.address,
              mixer_status: 'waiting',
              mixer_created_at: new Date().toISOString(),
            })
            .eq('user_wallet', wallet)
            .eq('token', token);
        } else {
          await supabase
            .from('zk_user_wallets')
            .insert({
              user_wallet: wallet,
              token: token,
              mixer_exchange_id: data.id,
              mixer_deposit_address: data.payinAddress || data.address,
              mixer_status: 'waiting',
              mixer_created_at: new Date().toISOString(),
            });
        }
      } catch (dbError: any) {
        console.error('⚠️ Failed to store mixer exchange:', dbError);
      }
    }

    return res.status(200).json({
      success: true,
      exchangeId: data.id,
      depositAddress: data.payinAddress || data.address,
      depositAmount: data.amount || amount,
      token: token,
      estimatedTime: '3-5 minutes',
      message: 'Send your funds to the deposit address. The Privacy Mixer will anonymize your transaction.',
    });

  } catch (error: any) {
    console.error('Error creating Privacy Mixer exchange:', error);
    return res.status(500).json({
      error: 'Failed to create Privacy Mixer exchange',
      message: error.message || 'Unknown error'
    });
  }
}
