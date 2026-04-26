// ============================================================
// Wallet — MetaMask connection & token balance management
// ============================================================
import { ethers } from 'ethers';
import { ARC_CHAIN, CONTRACTS, ERC20_ABI, TOKENS, switchToArc } from './arc-config';
import { getProvider, getBrowserProvider } from './arc-provider';

/**
 * Connect MetaMask wallet and switch to Arc Testnet
 * Returns { address, balances }
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  // Request account access
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock MetaMask.');
  }

  // Switch to Arc network
  await switchToArc();

  const address = accounts[0];
  const balances = await fetchBalances(address);

  return { address, balances };
}

/**
 * Fetch USDC, EURC, USYC balances for an address
 */
export async function fetchBalances(address) {
  const provider = getProvider();
  const balances = {};

  for (const [key, token] of Object.entries(TOKENS)) {
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const raw = await contract.balanceOf(address);
      balances[key] = {
        raw: raw.toString(),
        formatted: ethers.formatUnits(raw, token.decimals),
        symbol: token.symbol,
      };
    } catch (err) {
      console.warn(`Failed to fetch ${key} balance:`, err.message);
      balances[key] = { raw: '0', formatted: '0.00', symbol: token.symbol };
    }
  }

  // Also fetch native balance (USDC gas)
  try {
    const nativeBal = await provider.getBalance(address);
    balances.NATIVE = {
      raw: nativeBal.toString(),
      formatted: ethers.formatUnits(nativeBal, 18),
      symbol: 'USDC (Gas)',
    };
  } catch (err) {
    balances.NATIVE = { raw: '0', formatted: '0.00', symbol: 'USDC (Gas)' };
  }

  return balances;
}

/**
 * Transfer ERC-20 tokens on Arc
 */
export async function transferToken(tokenKey, toAddress, amount) {
  const token = TOKENS[tokenKey];
  if (!token) throw new Error(`Unknown token: ${tokenKey}`);

  const browserProvider = getBrowserProvider();
  if (!browserProvider) throw new Error('No wallet connected');

  const signer = await browserProvider.getSigner();
  const contract = new ethers.Contract(token.address, ERC20_ABI, signer);

  const amountWei = ethers.parseUnits(amount, token.decimals);
  const tx = await contract.transfer(toAddress, amountWei);

  return tx;
}

/**
 * Get recent transactions for an address (via RPC getLogs)
 */
export async function getRecentTransfers(address, limit = 10) {
  const provider = getProvider();
  const transfers = [];

  for (const [key, token] of Object.entries(TOKENS)) {
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 5000);

      // Get transfers TO this address
      const filterTo = contract.filters.Transfer(null, address);
      const logsTo = await contract.queryFilter(filterTo, fromBlock, currentBlock);

      // Get transfers FROM this address
      const filterFrom = contract.filters.Transfer(address, null);
      const logsFrom = await contract.queryFilter(filterFrom, fromBlock, currentBlock);

      for (const log of [...logsTo, ...logsFrom]) {
        transfers.push({
          token: key,
          symbol: token.symbol,
          from: log.args[0],
          to: log.args[1],
          amount: ethers.formatUnits(log.args[2], token.decimals),
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          direction: log.args[1].toLowerCase() === address.toLowerCase() ? 'in' : 'out',
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch ${key} transfers:`, err.message);
    }
  }

  // Sort by block number desc and limit
  transfers.sort((a, b) => b.blockNumber - a.blockNumber);
  return transfers.slice(0, limit);
}

/**
 * Listen for wallet account/chain changes
 */
export function onWalletChange(callback) {
  if (!window.ethereum) return () => {};

  const handleAccounts = (accounts) => {
    callback({ type: 'accountsChanged', accounts });
  };
  const handleChain = (chainId) => {
    callback({ type: 'chainChanged', chainId });
  };

  window.ethereum.on('accountsChanged', handleAccounts);
  window.ethereum.on('chainChanged', handleChain);

  return () => {
    window.ethereum.removeListener('accountsChanged', handleAccounts);
    window.ethereum.removeListener('chainChanged', handleChain);
  };
}
