import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import proxyHls from '../shared/hlsProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());

const HLS_ROOT = path.join(__dirname, '..', 'temp', 'hls', 'espn');
const activeTranscodes = new Map();

function getHlsDir(id) {
  return path.join(HLS_ROOT, id);
}

function ensureHlsDir(id) {
  const dir = getHlsDir(id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function startTranscode(id) {
  if (activeTranscodes.has(id)) {
    const entry = activeTranscodes.get(id);
    entry.lastAccess = Date.now();
    if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);
    entry.cleanupTimer = setTimeout(() => stopTranscode(id), 60000);
    return entry;
  }

  const dir = ensureHlsDir(id);
  const playlist = path.join(dir, 'playlist.m3u8');
  const segmentPattern = path.join(dir, 'seg%03d.ts');

  if (fs.existsSync(playlist)) {
    try { fs.unlinkSync(playlist); } catch {}
  }
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.ts')) try { fs.unlinkSync(path.join(dir, f)); } catch {}
  }

  const upstream = `http://181.78.79.131:8000/play/${id}`;
  console.log(`[HLS] Starting ffmpeg for ${id} -> ${upstream}`);

  const args = [
    '-user_agent', 'VLC/3.0.21 LibVLC/3.0.21',
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', upstream,
    '-c', 'copy',
    '-hls_time', '2',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments+append_list+independent_segments',
    '-hls_segment_filename', segmentPattern,
    playlist,
  ];

  const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stderr.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('Error') || msg.includes('error')) console.error(`[HLS ${id}] ${msg.trim()}`);
  });

  proc.on('error', (err) => {
    console.error(`[HLS ${id}] spawn error:`, err.message);
  });

  proc.on('exit', (code, signal) => {
    console.log(`[HLS ${id}] ffmpeg exit code=${code} signal=${signal}`);
    const entry = activeTranscodes.get(id);
    if (entry && entry.proc === proc) {
      activeTranscodes.delete(id);
    }
  });

  const entry = {
    proc,
    dir,
    playlist,
    lastAccess: Date.now(),
    cleanupTimer: setTimeout(() => stopTranscode(id), 60000),
  };
  activeTranscodes.set(id, entry);
  return entry;
}

function stopTranscode(id) {
  const entry = activeTranscodes.get(id);
  if (!entry) return;
  console.log(`[HLS] Stopping ffmpeg for ${id} (idle timeout)`);
  try { entry.proc.kill('SIGKILL'); } catch {}
  if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);
  activeTranscodes.delete(id);
}

async function waitForPlaylist(playlist, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(playlist)) {
      const content = fs.readFileSync(playlist, 'utf-8');
      if (content.includes('.ts')) return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

app.get('/hls/espn/:id/playlist.m3u8', async (req, res) => {
  const { id } = req.params;
  const entry = startTranscode(id);
  const ready = await waitForPlaylist(entry.playlist);
  if (!ready) {
    console.error(`[HLS] playlist not ready for ${id}`);
    return res.status(504).send('#EXTM3U\n# timeout generating playlist');
  }
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(entry.playlist);
});

app.get('/hls/espn/:id/:segment', (req, res) => {
  const { id, segment } = req.params;
  if (!segment.endsWith('.ts') && segment !== 'playlist.m3u8') {
    return res.status(404).send('Not found');
  }
  const entry = activeTranscodes.get(id);
  if (entry) {
    entry.lastAccess = Date.now();
    if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);
    entry.cleanupTimer = setTimeout(() => stopTranscode(id), 60000);
  } else {
    startTranscode(id);
  }
  const filePath = path.join(getHlsDir(id), segment);
  if (!fs.existsSync(filePath)) return res.status(404).send('Segment not found');
  res.setHeader('Content-Type', 'video/mp2t');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

app.get('/proxy/espn/:id', async (req, res) => {
  const { id } = req.params;
  const url = `http://181.78.79.131:8000/play/${id}`;
  console.log(`[ESPN Proxy] Request for channel: ${id}`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VLC/3.0.21 LibVLC/3.0.21',
        'Accept': '*/*',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`[ESPN Proxy] Upstream error: ${response.status}`);
      return res.status(response.status).send('Stream not available');
    }
    
    console.log(`[ESPN Proxy] Connected, streaming...`);
    
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const nodeStream = Readable.fromWeb(response.body);
    await pipeline(nodeStream, res);
    
    console.log(`[ESPN Proxy] Stream completed`);
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.error('[ESPN Proxy] Timeout');
      if (!res.headersSent) {
        res.status(504).send('Stream timeout');
      }
    } else if (error.code === 'ERR_STREAM_PREMATURE_CLOSE') {
      console.log('[ESPN Proxy] Client disconnected');
    } else {
      console.error('[ESPN Proxy] Error:', error.message);
      if (!res.headersSent) {
        res.status(502).send('Error fetching stream');
      }
    }
  }
});

app.get('/proxy/espn/:id/:subpath', async (req, res) => {
  const { id, subpath } = req.params;
  const url = `http://181.78.79.131:8000/play/${id}/${subpath}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VLC/3.0.21 LibVLC/3.0.21',
        'Accept': '*/*',
      },
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      return res.status(response.status).send('Resource not available');
    }
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy subpath error:', error.message);
    res.status(502).send('Error fetching resource');
  }
});

app.get('/api/proxy', proxyHls);

app.get('/api/channels', (req, res) => {
  const filePath = path.join(__dirname, '..', 'canales.txt');
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
      const tsMatch = trimmed.match(/tve-ts="true"/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        group: groupMatch ? groupMatch[1] : 'Sin categoría',
        type: embedMatch ? 'embed' : tsMatch ? 'ts' : 'hls',
      };
      continue;
    }

    if (current && (trimmed.startsWith('http') || trimmed.startsWith('/proxy/') || trimmed.startsWith('/hls/'))) {
      urls.push(trimmed);
      if (trimmed.startsWith('/proxy/espn/')) {
        current.type = 'ts';
      } else if (trimmed.startsWith('/hls/')) {
        current.type = 'hls';
      }
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
});

app.get('/api/ppv', async (req, res) => {
  try {
    const response = await fetch('http://api.ppv.to/api/streams');
    if (!response.ok) {
      return res.json({ success: false, streams: [] });
    }
    const data = await response.json();
    res.json(data);
  } catch {
    res.json({ success: false, streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`NoveoTV API running on http://localhost:${PORT}`);
  console.log(`ffmpeg: ${ffmpegPath}`);
});
