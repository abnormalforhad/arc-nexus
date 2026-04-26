import { useState, useEffect } from 'react';
import { getProvider, getGasPrice } from '../lib/arc-provider';
import { ARC_CHAIN, CONTRACTS } from '../lib/arc-config';
import { ethers } from 'ethers';

export default function NetworkHealth() {
  const [data, setData] = useState({
    blockNumber: null,
    gasPrice: null,
    chainId: null,
    blockTime: null,
    tps: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const provider = getProvider();
    try {
      const [blockNum, feeData, network] = await Promise.all([
        provider.getBlockNumber(),
        getGasPrice(),
        provider.getNetwork(),
      ]);

      // Get last 2 blocks for block time calc
      let blockTime = null;
      let tps = null;
      try {
        const [b1, b2] = await Promise.all([
          provider.getBlock(blockNum),
          provider.getBlock(blockNum - 1),
        ]);
        if (b1 && b2) {
          blockTime = b1.timestamp - b2.timestamp;
          tps = b1.transactions ? (b1.transactions.length / Math.max(blockTime, 1)).toFixed(1) : '0';
        }
      } catch {}

      setData({
        blockNumber: blockNum,
        gasPrice: feeData?.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
        chainId: Number(network.chainId),
        blockTime,
        tps,
      });
      setLoading(false);
    } catch (err) {
      console.warn('Network health error:', err.message);
    }
  }

  const features = [
    { name: 'USDC Native Gas', desc: 'Pay fees in stable dollars, not volatile tokens', status: '✓ Active', color: 'var(--success)' },
    { name: 'Malachite BFT', desc: 'Rust-based Tendermint consensus engine', status: '✓ Running', color: 'var(--success)' },
    { name: 'Deterministic Finality', desc: 'Sub-second, non-reversible settlement', status: '~350-780ms', color: 'var(--accent)' },
    { name: 'Encrypted Mempool', desc: 'MEV mitigation via batch processing', status: '✓ Enabled', color: 'var(--success)' },
    { name: 'Opt-in Privacy', desc: 'Confidential transfers for compliance', status: '✓ Available', color: 'var(--success)' },
    { name: 'EVM Compatible', desc: 'Solidity, Hardhat, Foundry support', status: '✓ Full', color: 'var(--success)' },
  ];

  return (
    <div>
      <div className="grid-4 section-gap">
        <div className="stat-card">
          <div className="stat-label">Block Height</div>
          <div className="stat-value">
            {loading ? '...' : `#${data.blockNumber?.toLocaleString()}`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chain ID</div>
          <div className="stat-value">{data.chainId || '5042002'}</div>
          <div className="stat-sub">Arc Testnet</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Block Time</div>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.blockTime != null ? `${data.blockTime}s` : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gas Price</div>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {data.gasPrice ? `${Number(data.gasPrice).toFixed(2)}` : '—'}
          </div>
          <div className="stat-sub">Gwei (paid in USDC)</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">⚙️ Arc Protocol Features</div>
          <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>Testnet Active</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {features.map(f => (
            <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)',
              border: '1px solid transparent', transition: 'var(--transition)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2 }}>{f.desc}</div>
              </div>
              <span style={{ color: f.color, fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{f.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📍 Key Contract Addresses</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(CONTRACTS).slice(0, 8).map(([name, addr]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-base)' }}>
              <span style={{ fontWeight: 500, fontSize: '0.82rem' }}>{name}</span>
              <a href={`${ARC_CHAIN.explorerUrl}/address/${addr}`} target="_blank" rel="noopener" className="explorer-link">
                {addr.slice(0, 10)}...{addr.slice(-6)}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
