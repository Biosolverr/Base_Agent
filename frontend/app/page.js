'use client';
import { useState } from 'react';
import styles from './page.module.css';

const SIGNAL_COLORS = { bullish: '#0af0a0', bearish: '#ef4444', neutral: '#6b8899', warning: '#f59e0b' };
const TYPE_LABELS = { whale: '🐋 Кит', trader: '⚡ Трейдер', holder: '💎 Холдер', bot: '🤖 Бот', new_wallet: '🌱 Новый' };

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | triggering | done | error
  const [msg, setMsg] = useState('');

  async function fetchReport(addr) {
    setStatus('loading');
    setMsg('Загружаем отчёт...');
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
      setMsg(data.error || 'Ошибка');
    }
  }

  async function triggerAgent(addr) {
    setStatus('triggering');
    setMsg('Кошелёк не найден — запускаем агент...');
    const res = await fetch('/api/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: addr }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus('idle');
      setMsg('✓ Агент запущен. Отчёт появится через ~1–2 минуты. Попробуйте снова.');
    } else {
      setStatus('error');
      setMsg(data.error || 'Не удалось запустить агент');
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const addr = wallet.trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/i.test(addr)) {
      setStatus('error');
      setMsg('Некорректный адрес. Должен начинаться с 0x и содержать 40 символов.');
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
        <p className={styles.sub}>Onchain аналитик для Base L2 · powered by AI</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputWrap}>
          <span className={styles.inputPrefix}>0x</span>
          <input
            className={styles.input}
            placeholder="адрес кошелька..."
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            spellCheck={false}
          />
        </div>
        <button className={styles.btn} disabled={status === 'loading' || status === 'triggering'}>
          {status === 'loading' || status === 'triggering' ? '...' : 'АНАЛИЗ'}
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
                {report.generatedAt ? new Date(report.generatedAt).toLocaleString('ru') : ''}
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
              <div className={styles.sectionTitle}>Сигналы</div>
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
              <div className={styles.sectionTitle}>Топ токены</div>
              <div className={styles.tokens}>
                {report.topTokens.map((t, i) => (
                  <span key={i} className={styles.token}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {report.alerts?.length > 0 && (
            <div className={styles.alerts}>
              <div className={styles.sectionTitle}>⚠ Предупреждения</div>
              {report.alerts.map((a, i) => <div key={i} className={styles.alertItem}>{a}</div>)}
            </div>
          )}
        </div>
      )}

      <footer className={styles.footer}>
        Base L2 · Etherscan API · Grok / GLM · GitHub Actions · Vercel
      </footer>
    </main>
  );
}
