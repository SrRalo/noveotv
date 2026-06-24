import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/channels', (req, res) => {
  const filePath = path.join(__dirname, '..', 'canales.txt');
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
});

app.listen(PORT, () => {
  console.log(`NoveoTV API running on http://localhost:${PORT}`);
});
