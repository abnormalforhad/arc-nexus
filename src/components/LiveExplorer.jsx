import { useState, useEffect, useRef } from 'react';
import { getProvider } from '../lib/arc-provider';
import { ARC_CHAIN } from '../lib/arc-config';

export default function LiveExplorer() {
  const [blocks, setBlocks] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [avgBlockTime, setAvgBlockTime] = useState(null);
  const intervalRef = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    const provider = getProvider();
    let lastTimestamp = null;
    const blockTimes = [];

    async function fetchBlock(blockNum) {
      try {
        const block = await provider.getBlock(blockNum);
        if (!block) return null;
        if (lastTimestamp) {
          const diff = block.timestamp - lastTimestamp;
          blockTimes.push(diff);
          if (blockTimes.length > 20) blockTimes.shift();
          setAvgBlockTime((blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length).toFixed(2));
        }
        lastTimestamp = block.timestamp;
        return {
          number: block.number,
          hash: block.hash,
          timestamp: block.timestamp,
          txCount: block.transactions?.length || 0,
          gasUsed: block.gasUsed?.toString() || '0',
          gasLimit: block.gasLimit?.toString() || '0',
          miner: block.miner,
        };
      } catch { return null; }
    }

    async function startPolling() {
      setIsLive(true);
      let lastBlock = await provider.getBlockNumber();
      // Load initial blocks
      const initial = [];
      for (let i = Math.max(0, lastBlock - 9); i <= lastBlock; i++) {
        const b = await fetchBlock(i);
        if (b) initial.push(b);
      }
      setBlocks(initial);

      intervalRef.current = setInterval(async () => {
        try {
          const current = await provider.getBlockNumber();
          if (current > lastBlock) {
            for (let i = lastBlock + 1; i <= current; i++) {
              const b = await fetchBlock(i);
              if (b) {
                setBlocks(prev => {
                  const updated = [b, ...prev];
                  return updated.slice(0, 25);
                });
              }
            }
            lastBlock = current;
          }
        } catch (err) { console.warn('Poll error:', err.message); }
      }, 2000);
    }

    startPolling();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function timeAgo(ts) {
    const diff = Math.floor(Date.now() / 1000) - ts;
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return (
    <div>
      <div className="grid-3 section-gap">
        <div className="stat-card">
          <div className="stat-label">Latest Block</div>
          <div className="stat-value">
            {blocks[0] ? `#${blocks[0].number.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Block Time</div>
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {avgBlockTime ? `${avgBlockTime}s` : '—'}
          </div>
          <div className="stat-sub">Malachite BFT Consensus</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Feed Status</div>
          <div className="stat-value" style={{ background: isLive ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isLive ? '● LIVE' : '○ Connecting'}
          </div>
          <div className="stat-sub">Real-time RPC polling</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            ⛓️ Recent Blocks
            <span className="badge">LIVE</span>
          </div>
          <a href={ARC_CHAIN.explorerUrl} target="_blank" rel="noopener" className="explorer-link">
            View on ArcScan →
          </a>
        </div>
        <div className="block-feed" ref={feedRef}>
          {blocks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">⛓️</div>
              <p>Connecting to Arc Testnet...</p>
              <div className="spinner" style={{ margin: '16px auto' }} />
            </div>
          ) : blocks.map(b => (
            <div className="block-item" key={b.number}>
              <span className="block-number">#{b.number.toLocaleString()}</span>
              <span className="block-info">{b.txCount} txns</span>
              <span className="block-txs">
                {(BigInt(b.gasUsed) / BigInt(1000)).toString()}K gas
              </span>
              <span className="block-time">{timeAgo(b.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
