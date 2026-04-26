import { BRIDGE_CHAINS, CONTRACTS, ARC_CHAIN } from '../lib/arc-config';

export default function BridgeTracker() {
  const arcChain = BRIDGE_CHAINS.find(c => c.name === 'Arc');
  const otherChains = BRIDGE_CHAINS.filter(c => c.name !== 'Arc');

  return (
    <div>
      <div className="grid-3 section-gap">
        <div className="stat-card">
          <div className="stat-label">Protocol</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>CCTP v2</div>
          <div className="stat-sub">Cross-Chain Transfer Protocol</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Supported Chains</div>
          <div className="stat-value">{BRIDGE_CHAINS.length}</div>
          <div className="stat-sub">Including Arc</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Asset</div>
          <div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--usdc-color)' }}>USDC</div>
          <div className="stat-sub">Native burn & mint</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-header">
          <div className="card-title">🌉 Bridge Routes to Arc</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {otherChains.map(chain => (
            <div className="bridge-route" key={chain.name}>
              <div className="bridge-chain">
                <span style={{ fontSize: '1.3rem' }}>{chain.icon}</span>
                <span>{chain.name}</span>
              </div>
              <div className="bridge-line" />
              <div className="bridge-chain">
                <span style={{ fontSize: '1.3rem' }}>⚡</span>
                <span style={{ color: 'var(--accent)' }}>Arc</span>
              </div>
              <span className="tx-status confirmed">Active</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📜 CCTP Contracts on Arc</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'TokenMessengerV2', addr: CONTRACTS.CCTP_TokenMessenger, desc: 'Entry point for cross-chain burns' },
            { name: 'MessageTransmitterV2', addr: CONTRACTS.CCTP_MessageTransmitter, desc: 'Core messaging layer' },
            { name: 'TokenMinterV2', addr: CONTRACTS.CCTP_TokenMinter, desc: 'Minting & burning manager' },
            { name: 'Gateway', addr: CONTRACTS.Gateway, desc: 'Token gateway router' },
          ].map(c => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{c.desc}</div>
              </div>
              <a href={`${ARC_CHAIN.explorerUrl}/address/${c.addr}`} target="_blank"
                rel="noopener" className="explorer-link">{c.addr.slice(0, 10)}...{c.addr.slice(-6)}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
