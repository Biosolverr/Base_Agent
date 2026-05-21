import fetch from 'node-fetch';

const KEY = process.env.GROQ_API_KEY;

export async function analyzeWallet({ address, txs, tokenTxs, balance }) {
  if (!KEY) throw new Error('No GROQ_API_KEY');

  const summary = buildSummary({ address, txs, tokenTxs, balance });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: `You are a blockchain analyst for Base L2 (Coinbase).
Analyze this wallet's onchain activity and return ONLY valid JSON, no markdown, no explanation:
{
  "wallet": "<address>",
  "generatedAt": "<ISO timestamp>",
  "score": <0-100 activity score>,
  "type": "<whale|trader|holder|bot|new_wallet>",
  "signals": [{ "type": "<bullish|bearish|neutral|warning>", "text": "<one sentence in English>" }],
  "topTokens": ["<symbol>"],
  "summary": "<2-3 sentences in English describing wallet activity>",
  "alerts": ["<string if suspicious activity, otherwise empty array>"]
}

Wallet data:
${summary}` }],
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
  const sent = txs.filter(t => t.from?.toLowerCase() === address.toLowerCase()).length;
  const received = txs.filter(t => t.to?.toLowerCase() === address.toLowerCase()).length;
  const failed = txs.filter(t => t.isError).length;
  const methods = [...new Set(txs.map(t => t.method).filter(Boolean))].slice(0, 8);
  const tokens = [...new Set(tokenTxs.map(t => t.token))].slice(0, 10);
  const ethVolume = txs.reduce((s, t) => s + Number(t.value || 0), 0).toFixed(4);

  return `
Address: ${address}
ETH Balance: ${balance} ETH
Total txs: ${txs.length} (sent: ${sent}, received: ${received}, failed: ${failed})
ETH volume: ${ethVolume} ETH
Contract methods: ${methods.join(', ') || 'none'}
Tokens (${tokenTxs.length} txs): ${tokens.join(', ') || 'none'}
Recent txs:
${txs.slice(0, 5).map(t => `  ${t.time} | ${t.method} | ${t.value} ETH`).join('\n')}
`.trim();
}
