import { useState, useEffect } from 'react';
import { CONTRACTS } from '../lib/arc-config';

export default function StableFXPanel() {
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('EURC');
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRate() {
    setLoading(true);
    try {
      // Fetch real EUR/USD rate from a free API
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.rates?.EUR) {
        setRate({
          USDC_EURC: data.rates.EUR,
          EURC_USDC: 1 / data.rates.EUR,
          lastUpdate: new Date().toLocaleTimeString(),
        });
      }
    } catch {
      // Fallback rate
      setRate({ USDC_EURC: 0.92, EURC_USDC: 1.087, lastUpdate: 'Fallback' });
    }
    setLoading(false);
  }

  function swap() {
    setFromToken(toToken);
    setToToken(fromToken);
  }

  function getConvertedAmount() {
    if (!rate || !amount) return '0.00';
    const key = `${fromToken}_${toToken}`;
    const r = rate[key] || (fromToken === 'USDC' ? rate.USDC_EURC : rate.EURC_USDC);
    return (Number(amount) * r).toFixed(2);
  }

  const tokens = {
    USDC: { icon: '💵', name: 'USD Coin', color: '#2775CA' },
    EURC: { icon: '💶', name: 'Euro Coin', color: '#1B3A8C' },
  };

  return (
    <div>
      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">
            🔄 StableFX Swap
            <span className="simulated-badge">Simulated</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Rate updates every 30s
          </div>
        </div>

        {/* Rate Display */}
        {rate && (
          <div className="rate-display section-gap">
            <span>1 USDC = {rate.USDC_EURC.toFixed(4)} EURC</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
              Updated: {rate.lastUpdate}
            </span>
          </div>
        )}

        {/* From */}
        <div className="swap-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>From</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{tokens[fromToken].name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '1.6rem' }}>{tokens[fromToken].icon}</div>
            <input className="form-input" type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700, border: 'none', background: 'transparent', padding: '4px 0' }} />
            <span style={{ fontWeight: 700, color: tokens[fromToken].color }}>{fromToken}</span>
          </div>
        </div>

        <div className="swap-arrow" onClick={swap}>⇅</div>

        {/* To */}
        <div className="swap-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>To</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{tokens[toToken].name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '1.6rem' }}>{tokens[toToken].icon}</div>
            <div style={{ flex: 1, fontSize: '1.2rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", padding: '4px 0' }}>
              {loading ? '...' : getConvertedAmount()}
            </div>
            <span style={{ fontWeight: 700, color: tokens[toToken].color }}>{toToken}</span>
          </div>
        </div>

        {/* Swap details */}
        <div style={{ marginTop: 18, padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Exchange Rate</span>
            <span>{rate ? `1 ${fromToken} = ${(fromToken === 'USDC' ? rate.USDC_EURC : rate.EURC_USDC).toFixed(4)} ${toToken}` : '...'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Settlement</span>
            <span style={{ color: 'var(--success)' }}>Atomic PvP</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>StableFX Contract</span>
            <a href={`https://testnet.arcscan.app/address/${CONTRACTS.StableFX}`} target="_blank"
              rel="noopener" className="explorer-link">{CONTRACTS.StableFX.slice(0, 10)}...</a>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} disabled>
          🔒 Requires StableFX API Access (KYB)
        </button>

        <div style={{ marginTop: 14, padding: 12, borderRadius: 'var(--radius-sm)',
          background: 'var(--warning-bg)', border: '1px solid rgba(245,158,11,0.18)',
          fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--warning)' }}>ℹ Simulated Mode:</strong> StableFX uses a permissioned RFQ (Request-for-Quote)
          model with institutional KYB verification. Rates shown are live EUR/USD rates. On mainnet, multiple liquidity providers
          compete to offer the best quote, with atomic onchain settlement via smart contract escrow.
        </div>
      </div>
    </div>
  );
}
