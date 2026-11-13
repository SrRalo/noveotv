import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const filePath = path.join(process.cwd(), 'canales.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const channels = [];
  let current = null;
  let urls = [];

  const flush = () => {
    if (current && urls.length > 0) {
      const [url, ...rest] = urls;
      const channel = { ...current, url };
      if (rest.length > 0) {
        channel.sources = urls.map((sourceUrl, i) => ({ tag: `Opción ${i + 1}`, url: sourceUrl }));
      }
      channels.push(channel);
    }
    current = null;
    urls = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed === '#EXTM3U') {
      flush();
      continue;
    }

    if (trimmed.startsWith('#EXTINF:')) {
      flush();
      const groupMatch = trimmed.match(/group-title="([^"]+)"/);
      const nameMatch = trimmed.match(/,(.+)$/);
      const embedMatch = trimmed.match(/tve-embed="true"/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        group: groupMatch ? groupMatch[1] : 'Sin categoría',
        type: embedMatch ? 'embed' : 'hls',
      };
      continue;
    }

    if (current && trimmed.startsWith('http')) {
      urls.push(trimmed);
    }
  }

  flush();

  const { group } = req.query;
  let result = channels;
  if (group) {
    result = channels.filter((c) => c.group === group);
  }

  const groups = [...new Set(channels.map((c) => c.group))];

  res.json({ channels: result, groups });
}
