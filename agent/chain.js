import fetch from 'node-fetch';

const KEY = process.env.ETHERSCAN_API_KEY;
const BASE = 'https://api.etherscan.io/v2/api?chainid=8453';

export async function getWalletTxs(address, limit = 50) {
  const url = `${BASE}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${KEY}`;
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
  const url = `${BASE}&module=account&action=tokentx&address=${address}&page=1&offset=${limit}&sort=desc&apikey=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== '1') return [];
  return data.result.map(tx => ({
    token: tx.tokenSymbol,
    from: tx.from,
    to: tx.to,
    value: (Number(tx.value) / Ma
