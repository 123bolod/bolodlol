// api/update-products.js  (Vercel serverless endpoint)
export default async function handler(req, res) {
  // CORS (mobile/Pages থেকে কলের জন্য)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // OPTIONAL: ফ্রন্টএন্ডে X-App-Key চেক করতে চাইলে
  if (process.env.APP_KEY && req.headers['x-app-key'] !== process.env.APP_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token  = process.env.GITHUB_TOKEN;      // GitHub PAT
  const owner  = process.env.GITHUB_OWNER;      // 123bolod
  const repo   = process.env.GITHUB_REPO;       // bolod
  const branch = process.env.GITHUB_BRANCH || 'main';
  const path   = process.env.GITHUB_FILE   || 'products.json';

  try {
    const payload = req.body; // {settings:{...}, products:[...]}
    const jsonStr = JSON.stringify(payload, null, 2);
    const contentB64 = Buffer.from(jsonStr, 'utf8').toString('base64');

    // current file sha (update করতে প্রয়োজন)
    const metaResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
    );
    const meta = await metaResp.json();
    const sha = meta.sha; // ফাইল না থাকলে undefined

    const putResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'chore: auto sync products.json',
          content: contentB64,
          branch,
          sha
        })
      }
    );

    if (!putResp.ok) {
      const txt = await putResp.text();
      return res.status(500).json({ error: 'GitHub update failed', detail: txt });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}
