// ============================================================
// Arc Testnet — Chain Configuration & Contract Addresses
// ============================================================

export const ARC_CHAIN = {
  chainId: 5042002,
  chainIdHex: '0x4CEB12',
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.network',
  wssUrl: 'wss://rpc.testnet.arc.network',
  explorerUrl: 'https://testnet.arcscan.app',
  faucetUrl: 'https://faucet.circle.com',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
};

// Official contract addresses from Arc Docs
export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  EURC: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  USYC: '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C',
  StableFX: '0x867650F5eAe8df91445971f14d89fd84F0C9a9f8',
  CCTP_TokenMessenger: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  CCTP_MessageTransmitter: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
  CCTP_TokenMinter: '0xb43db544E2c27092c107639Ad201b3dEfAbcF192',
  Gateway: '0x0077777d7EBA4688BDeF3E311b846F25870A19B9',
  GatewayRouter: '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B',
  Multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  Permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
};

// Minimal ERC-20 ABI for token interactions
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Token metadata for the UI
export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: CONTRACTS.USDC,
    decimals: 6,
    color: '#2775CA',
    icon: '💵',
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: CONTRACTS.EURC,
    decimals: 6,
    color: '#1B3A8C',
    icon: '💶',
  },
  USYC: {
    symbol: 'USYC',
    name: 'US Yield Coin',
    address: CONTRACTS.USYC,
    decimals: 6,
    color: '#00C853',
    icon: '📈',
  },
};

// CCTP supported chains for bridge tracking
export const BRIDGE_CHAINS = [
  { name: 'Ethereum', domain: 0, icon: '⟠', color: '#627EEA' },
  { name: 'Base', domain: 6, icon: '🔵', color: '#0052FF' },
  { name: 'Solana', domain: 5, icon: '◎', color: '#9945FF' },
  { name: 'Arbitrum', domain: 3, icon: '🔷', color: '#28A0F0' },
  { name: 'Avalanche', domain: 1, icon: '🔺', color: '#E84142' },
  { name: 'Arc', domain: 10, icon: '⚡', color: '#00d4ff' },
];

/**
 * Add Arc Testnet to MetaMask
 */
export async function addArcToMetaMask() {
  if (!window.ethereum) throw new Error('MetaMask not detected');

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ARC_CHAIN.chainIdHex,
        chainName: ARC_CHAIN.name,
        nativeCurrency: ARC_CHAIN.nativeCurrency,
        rpcUrls: [ARC_CHAIN.rpcUrl],
        blockExplorerUrls: [ARC_CHAIN.explorerUrl],
      }],
    });
    return true;
  } catch (err) {
    console.error('Failed to add Arc network:', err);
    throw err;
  }
}

/**
 * Switch MetaMask to Arc Testnet
 */
export async function switchToArc() {
  if (!window.ethereum) throw new Error('MetaMask not detected');

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARC_CHAIN.chainIdHex }],
    });
    return true;
  } catch (err) {
    // Chain not added — add it
    if (err.code === 4902) {
      return addArcToMetaMask();
    }
    throw err;
  }
}
