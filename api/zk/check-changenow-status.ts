/**
 * Void402 Privacy Mixer Status Check API (1:1 with Nolvipay)
 * GET /api/zk/check-changenow-status
 * 
 * Checks the status of a Privacy Mixer exchange
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const CHANGENOW_API_KEY = process.env.CHANGENOW_API_KEY;
const CHANGENOW_BASE_URL = 'https://api.changenow.io/v1';

const ALLOWED_ORIGINS = [
  "https://void402.com",
  "https://www.void402.com",
  "https://orb402.com",
  "https://www.orb402.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getAllowedOrigin(origin: string | undefined): string {
  if (!origin) return "https://www.orb402.com";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (origin.match(/^https:\/\/code-whisperer-33[\w-]*\.vercel\.app/)) return origin;
  return "https://www.orb402.com";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = getAllowedOrigin(req.headers.origin as string | undefined);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { exchangeId } = req.query;

    if (!exchangeId || typeof exchangeId !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid exchangeId',
        message: 'exchangeId query parameter is required' 
      });
    }

    // Validate exchange ID format (alphanumeric hex, 10-64 chars)
    if (!/^[a-f0-9A-F]{10,64}$/i.test(exchangeId)) {
      return res.status(400).json({
        error: 'Invalid exchange ID format',
        message: 'Exchange ID must be alphanumeric (hex) and 10-64 characters'
      });
    }

    if (!CHANGENOW_API_KEY) {
      return res.status(500).json({ 
        error: 'Privacy Mixer not configured',
        message: 'CHANGENOW_API_KEY environment variable not set' 
      });
    }

    console.log(`🔍 PRIVACY MIXER: Checking exchange status: ${exchangeId}`);

    const response = await fetch(`${CHANGENOW_BASE_URL}/transactions/${exchangeId}/${CHANGENOW_API_KEY}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Void402/1.0',
        'Accept': 'application/json',
        'x-forwarded-for': req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || '0.0.0.0',
      },
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
        message: data.message || data.error || 'Failed to check exchange status',
      });
    }

    if (data && data.id && data.id !== exchangeId) {
      return res.status(404).json({
        error: 'Exchange not found',
        message: `Exchange ${exchangeId} not found`,
      });
    }

    const status = data.status || 'unknown';
    const isCompleted = status === 'finished' || status === 'completed' || status === 'done';
    const isFailed = status === 'failed' || status === 'refunded' || status === 'expired';

    console.log(`📊 PRIVACY MIXER: Exchange ${exchangeId} status: ${status}`);

    return res.status(200).json({
      success: true,
      exchangeId: data.id || exchangeId,
      status: status,
      isCompleted: isCompleted,
      isFailed: isFailed,
      depositAddress: data.payinAddress || data.payin?.address,
      withdrawalAddress: data.payoutAddress || data.payout?.address,
      depositHash: data.payinHash || data.payin?.hash,
      withdrawalHash: data.payoutHash || data.payout?.hash,
      amount: data.amount,
      amountExpectedFrom: data.amountExpectedFrom || data.expectedAmountFrom,
      amountExpectedTo: data.amountExpectedTo || data.expectedAmountTo,
      fromCurrency: data.fromCurrency || data.from?.currency,
      toCurrency: data.toCurrency || data.to?.currency
    });

  } catch (error: any) {
    console.error('Error checking Privacy Mixer status:', error);
    return res.status(500).json({
      error: 'Failed to check Privacy Mixer status',
      message: error.message || 'Unknown error'
    });
  }
}
