/**
 * Base Network Utilities for Void402 ZK integration
 * Handles connection, contract instances, and address validation for Base L2
 * Mirrors void402-solana.ts for EVM/Base chain
 */

import { ethers } from 'ethers';

// Base Network Configuration
export const BASE_MAINNET = {
  chainId: 8453,
  name: 'Base',
  rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  usdt: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
};

export const BASE_SEPOLIA = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  usdt: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Sepolia only has USDC test token
};

// Get network config based on environment
export function getNetworkConfig() {
  const isMainnet = process.env.NETWORK === 'mainnet' || process.env.NODE_ENV === 'production';
  return isMainnet ? BASE_MAINNET : BASE_SEPOLIA;
}

// Get Base JSON-RPC provider
export function getBaseProvider(): ethers.JsonRpcProvider {
  const config = getNetworkConfig();
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

// Get signer from private key (for relayer/collection operations)
export function getBaseSigner(privateKey?: string): ethers.Wallet {
  const key = privateKey || process.env.RELAYER_PRIVATE_KEY;
  if (!key) {
    throw new Error('RELAYER_PRIVATE_KEY not configured');
  }
  const provider = getBaseProvider();
  return new ethers.Wallet(key, provider);
}

// Get X402PrivacyPool contract address
export function getContractAddress(): string {
  const address = process.env.X402_PRIVACY_POOL_ADDRESS;
  if (!address) {
    throw new Error('X402_PRIVACY_POOL_ADDRESS not configured');
  }
  return address;
}

// Get USDC address for current network
export function getUsdcAddress(): string {
  const config = getNetworkConfig();
  return process.env.BASE_USDC_ADDRESS || config.usdc;
}

// Get token address by symbol (USDC or USDT) for current network
export function getTokenAddress(token: string): string {
  const config = getNetworkConfig();
  if (token === 'USDT') {
    return process.env.BASE_USDT_ADDRESS || config.usdt;
  }
  return process.env.BASE_USDC_ADDRESS || config.usdc;
}

// Validate Ethereum address
export function isValidBaseAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

// Generate deterministic wallet from deposit ID (for holding wallets)
export function generateHoldingWallet(depositId: string): ethers.Wallet {
  const seed = ethers.keccak256(ethers.toUtf8Bytes(depositId));
  const wallet = new ethers.Wallet(seed);
  return wallet.connect(getBaseProvider());
}

// Format USDC amount (6 decimals) from bigint to string
export function formatUsdc(amount: bigint): string {
  return ethers.formatUnits(amount, 6);
}

// Parse USDC amount (6 decimals) from string to bigint
export function parseUsdc(amount: string): bigint {
  return ethers.parseUnits(amount, 6);
}

// ERC20 ABI (minimal for USDC operations)
export const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

// X402PrivacyPool ABI
export const X402_PRIVACY_POOL_ABI = [
  // State-changing functions
  'function deposit(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function uploadProof(uint256 nonce, uint256 amount, address token, bytes proofBytes, bytes commitmentBytes, bytes blindingFactorBytes) external',
  'function initRecipientBalance(address recipient, address token) external',
  'function internalTransfer(bytes32 proofId, address recipient, uint256 relayerFee) external',
  'function externalTransfer(bytes32 proofId, address recipient, uint256 relayerFee) external',

  // Admin functions
  'function addRelayer(address relayer) external',
  'function addSupportedToken(address token) external',

  // View functions
  'function getUserBalance(address user, address token) view returns (uint256 available, uint256 deposited, uint256 withdrawn)',
  'function getPoolInfo(address token) view returns (uint256 totalDeposited, bool initialized)',
  'function getProofInfo(bytes32 proofId) view returns (address sender, uint256 amount, address token, bool used, bool initialized)',
  'function isRelayer(address account) view returns (bool)',
  'function getProofId(uint256 nonce) pure returns (bytes32)',
  'function supportedTokens(address token) view returns (bool)',

  // Events
  'event Deposit(address indexed user, address indexed token, uint256 amount)',
  'event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 fee)',
  'event ProofUploaded(bytes32 indexed proofId, address indexed sender, uint256 amount)',
  'event InternalTransfer(bytes32 indexed proofId, address indexed recipient, uint256 amount)',
  'event ExternalTransfer(bytes32 indexed proofId, address indexed recipient, uint256 amount)',
];

// DepositRouter ABI (v2 — accepts any ERC20 token)
export const DEPOSIT_ROUTER_ABI = [
  'function depositWithGas(address token, address holdingWallet, uint256 amount) external payable',
  'function collectionWallet() view returns (address)',
  'event DepositWithGas(address indexed user, address indexed holdingWallet, address indexed token, uint256 amount, uint256 ethAmount)',
];

// Get DepositRouter contract address
export function getDepositRouterAddress(): string {
  const address = process.env.DEPOSIT_ROUTER_ADDRESS;
  if (!address) {
    throw new Error('DEPOSIT_ROUTER_ADDRESS not configured');
  }
  return address;
}

// Get DepositRouter contract instance
export function getDepositRouterContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
  const address = getDepositRouterAddress();
  const providerOrSigner = signerOrProvider || getBaseProvider();
  return new ethers.Contract(address, DEPOSIT_ROUTER_ABI, providerOrSigner);
}

// Get X402PrivacyPool contract instance
export function getPrivacyPoolContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
  const address = getContractAddress();
  const providerOrSigner = signerOrProvider || getBaseProvider();
  return new ethers.Contract(address, X402_PRIVACY_POOL_ABI, providerOrSigner);
}

// Get USDC contract instance
export function getUsdcContract(signerOrProvider?: ethers.Signer | ethers.Provider): ethers.Contract {
  const address = getUsdcAddress();
  const providerOrSigner = signerOrProvider || getBaseProvider();
  return new ethers.Contract(address, ERC20_ABI, providerOrSigner);
}
