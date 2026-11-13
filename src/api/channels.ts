import type { Channel, ChannelsResponse } from '../types';

function parseM3U(content: string): ChannelsResponse {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let current: Partial<Channel> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '#EXTM3U') continue;

    if (trimmed.startsWith('#EXTINF:')) {
      const groupMatch = trimmed.match(/group-title="([^"]+)"/);
      const nameMatch = trimmed.match(/,(.+)$/);
      const embedMatch = trimmed.match(/tve-embed="true"/);
      const tsMatch = trimmed.match(/tve-ts="true"/);
      current = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        group: groupMatch ? groupMatch[1] : 'Sin categoría',
        type: embedMatch ? 'embed' : tsMatch ? 'ts' : 'hls',
        url: '',
      };
    } else if (current && (trimmed.startsWith('http') || trimmed.startsWith('/proxy/'))) {
      current.url = trimmed;
      if (trimmed.startsWith('/proxy/espn/')) {
        current.type = 'ts';
      }
      channels.push(current as Channel);
      current = null;
    }
  }

  const groups = [...new Set(channels.map((c) => c.group))];
  return { channels, groups };
}

function proxify(channel: Channel): Channel {
  if (!channel.url.startsWith('http://')) return channel;
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') return channel;
  return { ...channel, url: `/api/proxy?url=${encodeURIComponent(channel.url)}` };
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
