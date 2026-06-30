export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('http://api.ppv.to/api/streams');
    if (!response.ok) {
      return res.status(response.status).json({ success: false });
    }
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(502).json({ success: false });
  }
}
