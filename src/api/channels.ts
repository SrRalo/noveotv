import type { Channel, ChannelsResponse } from '../types';

function parseM3U(content: string): ChannelsResponse {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let pending: Partial<Channel> | null = null;
  let urls: string[] = [];

  const flush = () => {
    if (pending && urls.length > 0) {
      const [url, ...rest] = urls;
      const channel: Channel = {
        name: pending.name ?? 'Unknown',
        group: pending.group ?? 'Sin categoría',
        type: pending.type ?? 'hls',
        url,
      };
      if (rest.length > 0) {
        channel.sources = urls.map((sourceUrl, i) => ({ tag: `Opción ${i + 1}`, url: sourceUrl }));
      }
      channels.push(channel);
    }
    pending = null;
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
      pending = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        group: groupMatch ? groupMatch[1] : 'Sin categoría',
        type: embedMatch ? 'embed' : tsMatch ? 'ts' : 'hls',
      };
      continue;
    }

    if (pending && (trimmed.startsWith('http') || trimmed.startsWith('/proxy/') || trimmed.startsWith('/hls/'))) {
      urls.push(trimmed);
      if (trimmed.startsWith('/proxy/espn/')) {
        pending.type = 'ts';
      } else if (trimmed.startsWith('/hls/')) {
        pending.type = 'hls';
      }
    }
  }

  flush();

  const groups = [...new Set(channels.map((c) => c.group))];
  return { channels, groups };
}

function proxifyUrl(url: string): string {
  if (!url.startsWith('http://')) return url;
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') return url;
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}

function proxify(channel: Channel): Channel {
  const url = proxifyUrl(channel.url);
  const sources = channel.sources?.map((s) => ({ tag: s.tag, url: proxifyUrl(s.url) }));
  if (url === channel.url && !sources) return channel;
  return { ...channel, url, ...(sources ? { sources } : {}) };
}

function proxifyAll(response: ChannelsResponse): ChannelsResponse {
  return { ...response, channels: response.channels.map(proxify) };
}

export async function fetchChannels(group?: string): Promise<ChannelsResponse> {
  try {
    const params = group ? `?group=${encodeURIComponent(group)}` : '';
    const res = await fetch(`/api/channels${params}`);
    if (res.ok) return proxifyAll(await res.json());
  } catch {
    // API not available, fallback to static file
  }

  const res = await fetch('/canales.txt');
  const content = await res.text();
  const parsed = proxifyAll(parseM3U(content));

  if (group) {
    parsed.channels = parsed.channels.filter((c) => c.group === group);
  }

  return parsed;
}
