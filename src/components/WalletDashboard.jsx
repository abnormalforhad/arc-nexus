import { useState, useEffect } from 'react';
import { TOKENS, ARC_CHAIN } from '../lib/arc-config';
import { fetchBalances, getRecentTransfers } from '../lib/wallet';

export default function WalletDashboard({ wallet, onDisconnect }) {
  const [balances, setBalances] = useState(wallet?.balances || {});
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!wallet?.address) return;
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [wallet?.address]);

  async function refreshData() {
    if (!wallet?.address) return;
    setLoading(true);
    try {
      const [newBal, txs] = await Promise.all([
        fetchBalances(wallet.address),
        getRecentTransfers(wallet.address, 8),
      ]);
      setBalances(newBal);
      setTransfers(txs);
    } catch (err) { console.warn('Refresh error:', err.message); }
    setLoading(false);
  }

  function copyAddress() {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shortAddr(a) { return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : ''; }

  if (!wallet) {
    return (
      <div className="empty-state">
        <div className="icon">🔗</div>
        <p>Connect your MetaMask wallet to view your Arc portfolio and balances.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Wallet Info */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">👛 Connected Wallet</div>
          <button className="btn btn-sm btn-secondary" onClick={onDisconnect}>Disconnect</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: `linear-gradient(135deg, ${wallet.address.slice(2, 8)}, var(--accent))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', border: '2px solid var(--border-main)'
          }}>
            {wallet.address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div className="address address-short" onClick={copyAddress} title="Click to copy">
              {shortAddr(wallet.address)}
              {copied && <span style={{ marginLeft: 8, color: 'var(--success)', fontSize: '0.7rem' }}>✓ Copied</span>}
            </div>
            <a href={`${ARC_CHAIN.explorerUrl}/address/${wallet.address}`} target="_blank" rel="noopener" className="explorer-link">
              View on ArcScan
            </a>
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">💰 Token Balances {loading && <div className="spinner" />}</div>
          <button className="btn btn-sm btn-secondary" onClick={refreshData}>↻ Refresh</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(TOKENS).map(([key, token]) => (
            <div className="token-row" key={key}>
              <div className="token-icon" style={{ background: `${token.color}22`, border: `1px solid ${token.color}44` }}>
                {token.icon}
              </div>
              <div className="token-details">
                <div className="token-name">{token.name}</div>
                <div className="token-symbol">{token.symbol}</div>
              </div>
              <div className="token-balance">
                {balances[key] ? Number(balances[key].formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
              </div>
            </div>
          ))}
          {balances.NATIVE && (
            <div className="token-row">
              <div className="token-icon" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-accent)' }}>⛽</div>
              <div className="token-details">
                <div className="token-name">Native Balance</div>
                <div className="token-symbol">USDC (Gas)</div>
              </div>
              <div className="token-balance">
                {Number(balances.NATIVE.formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Recent Transfers</div>
        </div>
        {transfers.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <p>No recent transfers found in the last 5000 blocks.</p>
          </div>
        ) : transfers.map((tx, i) => (
          <div className="block-item" key={i} style={{ gridTemplateColumns: 'auto auto 1fr auto' }}>
            <span className="tx-status" style={{ background: tx.direction === 'in' ? 'var(--success-bg)' : 'var(--danger-bg)', color: tx.direction === 'in' ? 'var(--success)' : 'var(--danger)' }}>
              {tx.direction === 'in' ? '↓ IN' : '↑ OUT'}
            </span>
            <span style={{ fontWeight: 600 }}>{Number(tx.amount).toLocaleString()} {tx.symbol}</span>
            <span className="address" style={{ fontSize: '0.72rem' }}>
              {tx.direction === 'in' ? `from ${shortAddr(tx.from)}` : `to ${shortAddr(tx.to)}`}
            </span>
            <a href={`${ARC_CHAIN.explorerUrl}/tx/${tx.txHash}`} target="_blank" rel="noopener" className="explorer-link">
              View →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
