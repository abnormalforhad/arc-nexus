import { useState, useEffect } from 'react';
import './index.css';
import { connectWallet, onWalletChange, fetchBalances } from './lib/wallet';
import { ARC_CHAIN } from './lib/arc-config';
import LiveExplorer from './components/LiveExplorer';
import WalletDashboard from './components/WalletDashboard';
import TransferPanel from './components/TransferPanel';
import StableFXPanel from './components/StableFXPanel';
import BridgeTracker from './components/BridgeTracker';
import NetworkHealth from './components/NetworkHealth';

const NAV_ITEMS = [
  { id: 'explorer', icon: '⛓️', label: 'Explorer' },
  { id: 'wallet', icon: '👛', label: 'Wallet' },
  { id: 'transfer', icon: '💸', label: 'Transfer' },
  { id: 'swap', icon: '🔄', label: 'StableFX' },
  { id: 'bridge', icon: '🌉', label: 'Bridge' },
  { id: 'network', icon: '📡', label: 'Network' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('explorer');
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for wallet changes
    const cleanup = onWalletChange(async (event) => {
      if (event.type === 'accountsChanged') {
        if (event.accounts.length === 0) {
          setWallet(null);
        } else {
          try {
            const balances = await fetchBalances(event.accounts[0]);
            setWallet({ address: event.accounts[0], balances });
          } catch (err) {
            console.warn('Failed to fetch balances on account change:', err.message);
            setWallet({ address: event.accounts[0], balances: {} });
          }
        }
      }
      if (event.type === 'chainChanged') {
        // Refresh balances on chain change
        if (wallet?.address) {
          try {
            const balances = await fetchBalances(wallet.address);
            setWallet(prev => ({ ...prev, balances }));
          } catch (err) {
            console.warn('Failed to refresh balances on chain change:', err.message);
          }
        }
      }
    });
    return cleanup;
  }, [wallet?.address]);

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      const w = await connectWallet();
      setWallet(w);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.message);
      // Don't null out wallet if we already have one — partial connection is ok
    } finally {
      setConnecting(false);
    }
  }

  // Called by TransferPanel after successful tx to refresh balances
  async function refreshBalances() {
    if (wallet?.address) {
      try {
        const balances = await fetchBalances(wallet.address);
        setWallet(prev => ({ ...prev, balances }));
      } catch (err) {
        console.warn('Balance refresh failed:', err.message);
      }
    }
  }

  function handleDisconnect() {
    setWallet(null);
    setError('');
  }

  function renderContent() {
    switch (activeTab) {
      case 'explorer': return <LiveExplorer />;
      case 'wallet': return <WalletDashboard wallet={wallet} onDisconnect={handleDisconnect} />;
      case 'transfer': return <TransferPanel wallet={wallet} onTransferComplete={refreshBalances} />;
      case 'swap': return <StableFXPanel />;
      case 'bridge': return <BridgeTracker />;
      case 'network': return <NetworkHealth />;
      default: return <LiveExplorer />;
    }
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            <h1>Arc Nexus</h1>
            <span>Institutional Finance on Arc</span>
          </div>
        </div>

        <div className="header-right">
          <div className="network-badge">
            <span className="dot" />
            Arc Testnet
          </div>

          <a href={ARC_CHAIN.faucetUrl} target="_blank" rel="noopener" className="btn btn-sm btn-secondary">
            🚰 Get Testnet USDC
          </a>

          {wallet ? (
            <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('wallet')}>
              👛 {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            </button>
          ) : (
            <button className="btn btn-connect" onClick={handleConnect} disabled={connecting}>
              {connecting ? <><div className="spinner" /> Connecting...</> : '🦊 Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <nav className="sidebar">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main */}
      <main className="main-content">
        {error && (
          <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.18)',
            color: 'var(--danger)', fontSize: '0.82rem' }}>
            ⚠ {error}
            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none',
              color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}
