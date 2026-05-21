'use client';
import { useState } from 'react';
import styles from './page.module.css';

const SIGNAL_COLORS = { bullish: '#0af0a0', bearish: '#ef4444', neutral: '#6b8899', warning: '#f59e0b' };
const TYPE_LABELS = { whale: '🐋 Whale', trader: '⚡ Trader', holder: '💎 Holder', bot: '🤖 Bot', new_wallet: '🌱 New Wallet' };

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');

  async function fetchReport(addr) {
    setStatus('loading');
    setMsg('Loading report...');
    const res = await fetch(`/api/report?wallet=${addr}`);
    const data = await res.json();
    if (res.ok) {
      setReport(data);
      setStatus('done');
      setMsg('');
    } else if (res.status === 404) {
      await triggerAgent(addr);
    } else {
      setStatus('error');
      setMsg(data.error || 'Error loading report');
    }
  }

  async function triggerAgent(addr) {
    setStatus('triggering');
    setMsg('Wallet not found — starting agent...');
    const res = await fetch('/api/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: addr }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus('idle');
      setMsg('✓ Agent started. Report will be ready in ~1–2 minutes. Try again shortly.');
    } else {
      setStatus('error');
      setMsg(data.error || 'Failed to start agent');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const addr = wallet.trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/i.test(addr)) {
      setStatus('error');
      setMsg('Invalid address. Must start with 0x and contain 40 characters.');
      return;
    }
    setReport(null);
    fetchReport(addr);
  }

  const scoreColor = !report ? '#6b8899'
    : report.score >= 70 ? '#0af0a0'
    : report.score >= 40 ? '#f59e0b'
    : '#ef4444';

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>◈</span>
          <span>BASE AGENT</span>
        </div>
        <p className={styles.sub}>Onchain intelligence for Base L2 · powered by AI</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <span className={styles.inputPrefix}>0x</span>
          <input
            className={styles.input}
            placeholder="wallet address..."
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            spellCheck={false}
          />
        </div>
        <button className={styles.btn} disabled={status === 'loading' || status === 'triggering'}>
          {status === 'loading' || status === 'triggering' ? '...' : 'ANALYZE'}
        </button>
      </form>

      {msg && (
        <div className={`${styles.msg} ${status === 'error' ? styles.msgError : ''}`}>
          {msg}
        </div>
      )}

      {report && (
        <div className={styles.report}>
          <div className={styles.reportHeader}>
            <div>
              <div className={styles.reportAddr}>{report.wallet}</div>
              <div className={styles.reportTime}>
                {report.generatedAt ? new Date(report.generatedAt).toLocaleString('en') : ''}
              </div>
            </div>
            <div className={styles.scoreBlock}>
              <div className={styles.scoreVal} style={{ color: scoreColor }}>{report.score}</div>
              <div className={styles.scoreLabel}>score</div>
            </div>
          </div>

          {report.type && (
            <div className={styles.typeTag}>{TYPE_LABELS[report.type] || report.type}</div>
          )}

          {report.summary && (
            <div className={styles.summary}>{report.summary}</div>
          )}

          {report.signals?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Signals</div>
              <div className={styles.signals}>
                {report.signals.map((s, i) => (
                  <div key={i} className={styles.signal} style={{ borderColor: SIGNAL_COLORS[s.type] || '#333' }}>
                    <span className={styles.signalDot} style={{ background: SIGNAL_COLORS[s.type] || '#333' }} />
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.topTokens?.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Top Tokens</div>
              <div className={styles.tokens}>
                {report.topTokens.map((t, i) => (
                  <span key={i} className={styles.token}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {report.alerts?.length > 0 && (
            <div className={styles.alerts}>
              <div className={styles.sectionTitle}>⚠ Alerts</div>
              {report.alerts.map((a, i) => <div key={i} className={styles.alertItem}>{a}</div>)}
            </div>
          )}
        </div>
      )}

      <footer className={styles.footer}>
        Base L2 · Blockscout API · Groq AI · GitHub Actions · Vercel
      </footer>
    </main>
  );
}
