// ============================================================
// Arc Provider — JSON-RPC + WebSocket for real-time data
// ============================================================
import { ethers } from 'ethers';
import { ARC_CHAIN } from './arc-config';

let rpcProvider = null;
let wssProvider = null;
let wssReconnectTimer = null;

/**
 * Get the singleton JSON-RPC provider (read-only)
 */
export function getProvider() {
  if (!rpcProvider) {
    rpcProvider = new ethers.JsonRpcProvider(ARC_CHAIN.rpcUrl, {
      chainId: ARC_CHAIN.chainId,
      name: ARC_CHAIN.name,
    });
  }
  return rpcProvider;
}

/**
 * Get a WebSocket provider for real-time subscriptions
 * Includes auto-reconnect logic
 */
export function getWssProvider(onReconnect) {
  if (wssProvider) return wssProvider;

  try {
    wssProvider = new ethers.WebSocketProvider(ARC_CHAIN.wssUrl, {
      chainId: ARC_CHAIN.chainId,
      name: ARC_CHAIN.name,
    });

    // Handle disconnection with auto-reconnect
    wssProvider.websocket?.addEventListener?.('close', () => {
      console.warn('[Arc WSS] Connection closed. Reconnecting in 3s...');
      wssProvider = null;
      if (wssReconnectTimer) clearTimeout(wssReconnectTimer);
      wssReconnectTimer = setTimeout(() => {
        getWssProvider(onReconnect);
        if (onReconnect) onReconnect();
      }, 3000);
    });

    return wssProvider;
  } catch (err) {
    console.error('[Arc WSS] Failed to connect:', err);
    // Fallback to polling via JSON-RPC
    return getProvider();
  }
}

/**
 * Destroy WebSocket connection cleanly
 */
export function destroyWssProvider() {
  if (wssReconnectTimer) {
    clearTimeout(wssReconnectTimer);
    wssReconnectTimer = null;
  }
  if (wssProvider) {
    wssProvider.destroy();
    wssProvider = null;
  }
}

/**
 * Get the browser-injected provider (MetaMask)
 */
export function getBrowserProvider() {
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get a signer from MetaMask for write operations
 */
export async function getSigner() {
  const provider = getBrowserProvider();
  if (!provider) throw new Error('No wallet detected');
  return provider.getSigner();
}

/**
 * Fetch current gas price in USDC terms
 */
export async function getGasPrice() {
  const provider = getProvider();
  const feeData = await provider.getFeeData();
  return feeData;
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(tx) {
  const provider = getProvider();
  return provider.estimateGas(tx);
}
