import type { Channel, PpvResponse } from '../types';

const BASE_URL = 'https://api.ppv.to';

export async function fetchPpvStreams(): Promise<Channel[]> {
  const res = await fetch(`${BASE_URL}/api/streams`);
  if (!res.ok) return [];
  const data: PpvResponse = await res.json();
  if (!data.success) return [];

  const channels: Channel[] = [];

  for (const category of data.streams) {
    for (const stream of category.streams) {
      const now = Math.floor(Date.now() / 1000);
      const isLive = stream.starts_at <= now && now < stream.ends_at;
      const isUpcoming = stream.starts_at > now && stream.starts_at - now <= 3600;
      if (!isLive && !isUpcoming && !stream.always_live) continue;

      if (!stream.iframe) continue;

      channels.push({
        name: stream.name,
        group: `En Vivo · ${category.category}`,
        type: 'embed',
        url: stream.iframe,
        poster: stream.poster,
      });
    }
  }

  return channels;
}
