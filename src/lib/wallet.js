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

  // Force MetaMask to show the account picker (not just reuse the last one)
  let accounts;
  try {
    // wallet_requestPermissions forces the account selection popup
    const permissions = await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
    // After permission granted, get the selected accounts
    accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
  } catch (err) {
    if (err.code === 4001) {
      throw new Error('Connection rejected. Please approve the wallet connection.');
    }
    // Fallback to eth_requestAccounts if wallet_requestPermissions isn't supported
    try {
      accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
    } catch (fallbackErr) {
      throw fallbackErr;
    }
  }

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock MetaMask.');
  }

  // Switch to Arc network — don't fail the entire connection if this errors
  try {
    await switchToArc();
  } catch (err) {
    console.warn('Failed to switch to Arc network:', err.message);
    // Still proceed — user may already be on Arc or can switch manually
  }

  const address = accounts[0];
  let balances;
  try {
    balances = await fetchBalances(address);
  } catch (err) {
    console.warn('Failed to fetch initial balances:', err.message);
    balances = {};
  }

  return { address, balances };
}

/**
 * Fetch USDC, EURC, USYC balances for an address
 * Note: On Arc, USDC is the native gas token. We use getBalance() for USDC
 * and ERC-20 balanceOf() for EURC/USYC.
 */
export async function fetchBalances(address) {
  const provider = getProvider();
  const balances = {};

  // Fetch native USDC balance (Arc's gas token)
  try {
    const nativeBal = await provider.getBalance(address);
    // Native balance is 18 decimals, but we display as USDC (show as regular number)
    const formatted = ethers.formatUnits(nativeBal, 18);
    balances.USDC = {
      raw: nativeBal.toString(),
      formatted: formatted,
      symbol: 'USDC',
    };
    balances.NATIVE = {
      raw: nativeBal.toString(),
      formatted: formatted,
      symbol: 'USDC (Gas)',
    };
  } catch (err) {
    console.warn('Failed to fetch native USDC balance:', err.message);
    balances.USDC = { raw: '0', formatted: '0.00', symbol: 'USDC' };
    balances.NATIVE = { raw: '0', formatted: '0.00', symbol: 'USDC (Gas)' };
  }

  // Fetch ERC-20 token balances (EURC, USYC)
  for (const [key, token] of Object.entries(TOKENS)) {
    if (key === 'USDC') continue; // Already fetched as native
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

  return balances;
}

/**
 * Transfer tokens on Arc
 * USDC: Can be sent as native value transfer (like ETH) since USDC is Arc's native gas token
 * EURC/others: Standard ERC-20 transfer
 */
export async function transferToken(tokenKey, toAddress, amount) {
  const token = TOKENS[tokenKey];
  if (!token) throw new Error(`Unknown token: ${tokenKey}`);

  if (!window.ethereum) throw new Error('No wallet detected. Please install MetaMask.');

  // Try to ensure we're on Arc network (non-fatal — user may already be on Arc)
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainIdHex, 16);
    if (currentChainId !== ARC_CHAIN.chainId) {
      try {
        await switchToArc();
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (switchErr) {
        console.warn('Network switch failed, proceeding anyway:', switchErr.message);
      }
    }
  } catch (err) {
    console.warn('Chain check failed, proceeding with transfer:', err.message);
  }

  // Get a fresh provider + signer AFTER network switch
  const browserProvider = new ethers.BrowserProvider(window.ethereum, {
    chainId: ARC_CHAIN.chainId,
    name: ARC_CHAIN.name,
  });
  const signer = await browserProvider.getSigner();

  if (tokenKey === 'USDC') {
    // ===== USDC: Native value transfer =====
    // On Arc, USDC is the native gas token (18 decimals for native transfers)
    const amountWei = ethers.parseUnits(amount, 18); // Native uses 18 decimals

    // Check the user has enough native balance
    const balance = await browserProvider.getBalance(signer.address);
    if (balance < amountWei) {
      const balFormatted = ethers.formatUnits(balance, 18);
      throw new Error(
        `Insufficient USDC balance. You have ${Number(balFormatted).toFixed(4)} USDC but tried to send ${amount} USDC. ` +
        `Get testnet USDC from faucet.circle.com`
      );
    }

    // Send as native transfer (like sending ETH)
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: amountWei,
    });
    return tx;
  } else {
    // ===== EURC / other ERC-20 tokens: Standard ERC-20 transfer =====
    const contract = new ethers.Contract(token.address, ERC20_ABI, signer);

    const amountParsed = ethers.parseUnits(amount, token.decimals);

    // Check ERC-20 balance first
    const balance = await contract.balanceOf(signer.address);
    if (balance < amountParsed) {
      const balFormatted = ethers.formatUnits(balance, token.decimals);
      throw new Error(
        `Insufficient ${token.symbol} balance. You have ${Number(balFormatted).toFixed(4)} ${token.symbol} but tried to send ${amount}. ` +
        `Get testnet ${token.symbol} from faucet.circle.com`
      );
    }

    // Estimate gas to catch revert before sending
    try {
      await contract.transfer.estimateGas(toAddress, amountParsed);
    } catch (gasErr) {
      throw new Error(
        `Transaction will fail: ${gasErr.reason || gasErr.message || 'Unknown error'}. ` +
        `Make sure you have enough USDC for gas fees.`
      );
    }

    const tx = await contract.transfer(toAddress, amountParsed);
    return tx;
  }
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
