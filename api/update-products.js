// api/update-products.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Allow GET only for test with ?mode=testwrite
  const url = new URL(req.url, 'http://localhost');
  const testWrite = url.searchParams.get('mode') === 'testwrite';

  if (!(req.method === 'POST' || (req.method === 'GET' && testWrite))) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // APP_KEY via header or query (?app_key=)
  const key = req.headers['x-app-key'] || url.searchParams.get('app_key');
  if (process.env.APP_KEY && key !== process.env.APP_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token  = process.env.GITHUB_TOKEN;
    const owner  = process.env.GITHUB_OWNER;
    const repo   = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const path   = process.env.GITHUB_FILE   || 'products.json';
    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'Missing env vars' });
    }

    // Body parse (POST) or dummy payload (GET test)
    let payload;
    if (req.method === 'POST') {
      const raw = req.body ?? {};
      payload = (typeof raw === 'string') ? JSON.parse(raw || '{}') : raw;
    } else {
      // GET test payload
      payload = { _vercel: 'ok', ts: Date.now() };
    }

    const contentB64 = Buffer.from(JSON.stringify(payload, null, 2), 'utf8').toString('base64');

    // Get existing sha if file already exists
    let sha;
    const metaUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
    const metaResp = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });

    if (metaResp.status === 200) {
      const meta = await metaResp.json();
      sha = meta.sha;
    } else if (metaResp.status !== 404) {
      return res.status(500).json({ error: 'GitHub read failed', detail: await metaResp.text() });
    }

    const putBody = { message: 'chore: auto sync products.json', content: contentB64, branch };
    if (sha) putBody.sha = sha;

    const putResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      }
    );

    const putTxt = await putResp.text();
    if (!putResp.ok) {
      return res.status(500).json({ error: 'GitHub update failed', status: putResp.status, detail: putTxt });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String(e) });
  }
                     }
