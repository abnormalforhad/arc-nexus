import { useState } from 'react';
import { ethers } from 'ethers';
import { TOKENS, ARC_CHAIN } from '../lib/arc-config';
import { transferToken } from '../lib/wallet';

export default function TransferPanel({ wallet, onTransferComplete }) {
  const [token, setToken] = useState('USDC');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null); // null | 'pending' | 'confirmed' | 'error'
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  if (!wallet) {
    return (
      <div className="empty-state">
        <div className="icon">💸</div>
        <p>Connect your wallet to send stablecoins on Arc.</p>
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    setError('');
    setStatus(null);
    setTxHash('');

    if (!ethers.isAddress(recipient)) {
      setError('Invalid recipient address');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    try {
      setStatus('pending');
      const tx = await transferToken(token, recipient, amount);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setStatus('confirmed');
        // Refresh wallet balances after successful transfer
        if (onTransferComplete) onTransferComplete();
      } else {
        setStatus('error');
        setError('Transaction reverted');
      }
    } catch (err) {
      setStatus('error');
      setError(err.reason || err.message || 'Transaction failed');
    }
  }

  function setMax() {
    const bal = wallet.balances?.[token];
    if (bal) setAmount(bal.formatted);
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">💸 Send Stablecoins</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Gas paid in USDC — no volatile tokens needed
          </div>
        </div>

        <form onSubmit={handleSend}>
          <div className="form-group">
            <label className="form-label">Select Token</label>
            <div className="token-selector">
              {['USDC', 'EURC'].map(t => (
                <button type="button" key={t} className={`token-option ${token === t ? 'selected' : ''}`}
                  onClick={() => setToken(t)}>
                  {TOKENS[t].icon} {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Recipient Address</label>
            <input className="form-input" placeholder="0x..." value={recipient}
              onChange={e => setRecipient(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Amount</span>
              <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={setMax}>
                Max: {wallet.balances?.[token] ? Number(wallet.balances[token].formatted).toFixed(2) : '0.00'} {token}
              </span>
            </label>
            <input className="form-input" type="number" step="any" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-xs)', background: 'var(--danger-bg)',
              border: '1px solid rgba(239,68,68,0.18)', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={status === 'pending'}
            style={{ width: '100%' }}>
            {status === 'pending' ? (
              <><div className="spinner" /> Confirming...</>
            ) : `Send ${token}`}
          </button>
        </form>

        {txHash && (
          <div style={{ marginTop: 18, padding: 16, borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)',
            border: '1px solid rgba(16,185,129,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className={`tx-status ${status}`}>
                {status === 'pending' ? '⏳ Pending' : status === 'confirmed' ? '✓ Confirmed' : '✕ Failed'}
              </span>
            </div>
            <a href={`${ARC_CHAIN.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener" className="explorer-link">
              {txHash.slice(0, 16)}...{txHash.slice(-8)} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
