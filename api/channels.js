import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const filePath = path.join(process.cwd(), 'canales.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const channels = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '#EXTM3U') continue;

    if (trimmed.startsWith('#EXTINF:')) {
      const groupMatch = trimmed.match(/group-title="([^"]+)"/);
      const nameMatch = trimmed.match(/,(.+)$/);
      const embedMatch = trimmed.match(/tve-embed="true"/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        group: groupMatch ? groupMatch[1] : 'Sin categoría',
        type: embedMatch ? 'embed' : 'hls',
        url: '',
      };
    } else if (current && trimmed.startsWith('http')) {
      current.url = trimmed;
      channels.push(current);
      current = null;
    }
  }

  const { group } = req.query;
  let result = channels;
  if (group) {
    result = channels.filter((c) => c.group === group);
  }

  const groups = [...new Set(channels.map((c) => c.group))];

  res.json({ channels: result, groups });
}
