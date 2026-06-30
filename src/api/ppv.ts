import type { Channel, PpvResponse, StreamSource } from '../types';

const TARGET_CATEGORY = 'Football';

export async function fetchPpvStreams(): Promise<Channel[]> {
  const res = await fetch('/api/ppv');
  if (!res.ok) return [];
  const data: PpvResponse = await res.json();
  if (!data.success) return [];

  const channels: Channel[] = [];

  for (const category of data.streams) {
    if (category.category !== TARGET_CATEGORY) continue;

    for (const stream of category.streams) {
      const now = Math.floor(Date.now() / 1000);
      const isLive = stream.starts_at <= now && now < stream.ends_at;
      const isUpcoming = stream.starts_at > now && stream.starts_at - now <= 3600;
      if (!isLive && !isUpcoming && !stream.always_live) continue;

      const sources: StreamSource[] = [];

      if (stream.iframe) {
        sources.push({ tag: stream.source_tag || stream.tag || 'Default', url: stream.iframe });
      }

      for (const sub of stream.substreams || []) {
        if (sub.iframe && sub.source_tag) {
          sources.push({ tag: sub.source_tag, url: sub.iframe });
        }
      }

      if (sources.length === 0) continue;

      channels.push({
        name: stream.name,
        group: `En Vivo · ${category.category}`,
        type: 'embed',
        url: sources[0].url,
        poster: stream.poster,
        sources: sources.length > 1 ? sources : undefined,
        startsAt: stream.starts_at,
        endsAt: stream.ends_at,
      });
    }
  }

  return channels;
}
