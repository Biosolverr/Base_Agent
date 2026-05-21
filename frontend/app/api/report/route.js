const GITHUB_RAW = process.env.GITHUB_RAW_BASE;
// e.g. https://raw.githubusercontent.com/USER/REPO/main/reports

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase().trim();

  if (!wallet || !/^0x[0-9a-f]{40}$/i.test(wallet)) {
    return Response.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const url = `${GITHUB_RAW}/${wallet}.json`;
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5min

    if (res.status === 404) {
      return Response.json({ error: 'Wallet not found. It may not be tracked yet.' }, { status: 404 });
    }
    if (!res.ok) {
      throw new Error(`GitHub ${res.status}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
