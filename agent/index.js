import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { getWalletTxs, getTokenTxs, getNativeBalance } from './chain.js';
import { analyzeWallet } from './ai.js';

const REPORTS_DIR = '../reports';
const INDEX_FILE = `${REPORTS_DIR}/index.json`;

function getWallets() {
  const manual = process.env.MANUAL_WALLET?.trim();
  if (manual) return [manual];

  const raw = process.env.WALLETS || '[]';
  try {
    return JSON.parse(raw);
  } catch {
    console.error('WALLETS env is not valid JSON');
    return [];
  }
}

async function analyzeOne(address) {
  console.log(`\n→ Analyzing ${address}`);

  const [txs, tokenTxs, balance] = await Promise.all([
    getWalletTxs(address, 50),
    getTokenTxs(address, 30),
    getNativeBalance(address),
  ]);

  console.log(`  txs: ${txs.length}, token txs: ${tokenTxs.length}, balance: ${balance} ETH`);

  const report = await analyzeWallet({ address, txs, tokenTxs, balance });
  report.generatedAt = report.generatedAt || new Date().toISOString();

  return report;
}

async function main() {
  const wallets = getWallets();
  if (!wallets.length) {
    console.error('No wallets to analyze. Set WALLETS secret or pass manual wallet.');
    process.exit(0);
  }

  mkdirSync(REPORTS_DIR, { recursive: true });

  const results = [];
  for (const address of wallets) {
    try {
      const report = await analyzeOne(address.toLowerCase());
      const filename = `${REPORTS_DIR}/${address.toLowerCase()}.json`;
      writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`  ✓ saved ${filename}`);
      results.push({ address: address.toLowerCase(), generatedAt: report.generatedAt, score: report.score, type: report.type });
    } catch (err) {
      console.error(`  ✗ failed for ${address}:`, err.message);
      results.push({ address: address.toLowerCase(), error: err.message });
    }
    // rate limit pause
    await new Promise(r => setTimeout(r, 1200));
  }

  // update index
  const index = { updatedAt: new Date().toISOString(), wallets: results };
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log('\n✓ Index updated:', INDEX_FILE);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
