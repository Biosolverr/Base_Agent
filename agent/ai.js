import fetch from 'node-fetch';

const PROVIDER = process.env.AI_PROVIDER || 'grok';

const ENDPOINTS = {
  grok: {
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-fast',
    key: process.env.GROK_API_KEY,
  },
  glm: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',      // бесплатная квота
    key: process.env.GLM_API_KEY,
  },
};

export async function analyzeWallet({ address, txs, tokenTxs, balance }) {
  const cfg = ENDPOINTS[PROVIDER];
  if (!cfg.key) throw new Error(`No API key for provider: ${PROVIDER}`);

  const summary = buildSummary({ address, txs, tokenTxs, balance });

  const prompt = `You are a blockchain analyst for the Base L2 network (Coinbase).
Analyze this wallet's recent onchain activity and return a JSON report.

Wallet data:
${summary}

Return ONLY valid JSON, no markdown, in this exact shape:
{
  "wallet": "<address>",
  "generatedAt": "<ISO timestamp>",
  "score": <0-100 activity score>,
  "type": "<whale|trader|holder|bot|new_wallet>",
  "signals": [
    { "type": "<bullish|bearish|neutral|warning>", "text": "<one sentence in Russian>" }
  ],
  "topTokens": ["<symbol>", ...],
  "summary": "<2-3 sentence overview in Russian>",
  "alerts": ["<string if anything suspicious, else empty array>"]
}`;

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';

  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { wallet: address, error: 'parse_failed', raw };
  }
}

function buildSummary({ address, txs, tokenTxs, balance }) {
  const sent = txs.filter(t => t.from.toLowerCase() === address.toLowerCase()).length;
  const received = txs.filter(t => t.to?.toLowerCase() === address.toLowerCase()).length;
  const failed = txs.filter(t => t.isError).length;
  const methods = [...new Set(txs.map(t => t.method).filter(Boolean))].slice(0, 8);
  const tokens = [...new Set(tokenTxs.map(t => t.token))].slice(0, 10);
  const ethVolume = txs.reduce((s, t) => s + Number(t.value || 0), 0).toFixed(4);

  return `
Address: ${address}
ETH Balance: ${balance} ETH
Total txs analyzed: ${txs.length}
  Sent: ${sent}, Received: ${received}, Failed: ${failed}
ETH volume: ${ethVolume} ETH
Contract methods used: ${methods.join(', ') || 'none'}
Token activity (${tokenTxs.length} txs): ${tokens.join(', ') || 'none'}
Recent transactions (last 5):
${txs.slice(0, 5).map(t => `  ${t.time} | ${t.method} | ${t.value} ETH | ${t.isError ? 'FAILED' : 'ok'}`).join('\n')}
Recent token transfers (last 5):
${tokenTxs.slice(0, 5).map(t => `  ${t.time} | ${t.token} | ${t.value}`).join('\n')}
`.trim();
}
