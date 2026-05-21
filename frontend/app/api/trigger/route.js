const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_REPO = process.env.GITHUB_REPO; // e.g. username/base-agent

export async function POST(request) {
  const { wallet } = await request.json();

  if (!wallet || !/^0x[0-9a-f]{40}$/i.test(wallet)) {
    return Response.json({ error: 'Invalid wallet' }, { status: 400 });
  }

  if (!GH_TOKEN || !GH_REPO) {
    return Response.json({ error: 'Server not configured' }, { status: 500 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${GH_REPO}/actions/workflows/agent.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { wallet },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  return Response.json({ ok: true, message: 'Agent started. Check back in ~1 minute.' });
}
