import fetch from 'node-fetch';

const BASE = 'https://base.blockscout.com/api';

export async function getWalletTxs(address, limit = 50) {
  const url = `${BASE}?module=account&action=txlist&address=${address}&page=1&offset=${limit}&sort=desc`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') return [];
  return data.result.map(tx => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: (BigInt(tx.value) / BigInt(1e18)).toString(),
    time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
    method: tx.functionName?.split('(')[0] || 'transfer',
    isError: tx.isError === '1',
  }));
}

export async function getTokenTxs(address, limit = 30) {
  const url = `${BASE}?module=account&action=tokentx&address=${address}&page=1&offset=${limit}&sort=desc`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') return [];
  return data.result.map(tx => ({
    token: tx.tokenSymbol,
    from: tx.from,
    to: tx.to,
    value: (Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal))).toFixed(4),
    time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
  }));
}

export async function getNativeBalance(address) {
  const url = `${BASE}?module=account&action=balance&address=${address}&tag=latest`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') return '0';
  return (BigInt(data.result) / BigInt(1e14)).toString().replace(/(\d+)(\d{4})$/, '$1.$2');
}
