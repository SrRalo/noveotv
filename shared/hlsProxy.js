const ALLOWED_HOSTS = new Set([
  '45.224.97.181',
  '200.7.219.221',
  '190.107.232.9',
  '45.187.0.19',
  'iptv.makrodigitaltv.makrodigital.com',
  'provedores.unsion.tv',
  '45.170.130.224',
  '179.1.87.75',
]);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const TIMEOUT_MS = 15000;
const MAX_BYTES = 12 * 1024 * 1024;

function isAllowedTarget(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function toClientUrl(uri, base) {
  try {
    const absolute = new URL(uri, base).toString();
    if (!isAllowedTarget(absolute)) return absolute;
    return `/api/proxy?url=${encodeURIComponent(absolute)}`;
  } catch {
    return uri;
  }
}

function rewritePlaylist(content, base) {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (match, uri) => `URI="${toClientUrl(uri, base)}"`);
      }

      return toClientUrl(trimmed, base);
    })
    .join('\n');
}

function fail(res, status, message) {
  if (res.headersSent) return;
  res.status(status).send(message);
}

export default async function proxyHls(req, res) {
  const raw = req.query?.url ?? new URL(req.url, 'http://localhost').searchParams.get('url');
  const target = Array.isArray(raw) ? raw[0] : raw;

  if (!target) return fail(res, 400, 'Missing url parameter');
  if (!isAllowedTarget(target)) return fail(res, 403, 'Host not allowed');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let upstream;
  try {
    upstream = await fetch(target, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: '*/*',
      },
    });
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') return fail(res, 504, 'Upstream timeout');
    return fail(res, 502, 'Upstream unreachable');
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    return fail(res, upstream.status, `Upstream responded ${upstream.status}`);
  }

  const declaredLength = Number(upstream.headers.get('content-length') || 0);
  if (declaredLength > MAX_BYTES) return fail(res, 413, 'Resource too large');

  let buffer;
  try {
    buffer = Buffer.from(await upstream.arrayBuffer());
  } catch {
    return fail(res, 502, 'Upstream read failed');
  }

  if (buffer.length > MAX_BYTES) return fail(res, 413, 'Resource too large');

  const finalUrl = upstream.url || target;
  const upstreamType = upstream.headers.get('content-type') || '';

  if (buffer.subarray(0, 7).toString('utf8') === '#EXTM3U') {
    const rewritten = rewritePlaylist(buffer.toString('utf8'), finalUrl);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(rewritten);
  }

  res.setHeader('Content-Type', upstreamType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=30');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).send(buffer);
}
