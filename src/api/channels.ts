import type { ChannelsResponse } from '../types';

export async function fetchChannels(group?: string): Promise<ChannelsResponse> {
  const params = group ? `?group=${encodeURIComponent(group)}` : '';
  const res = await fetch(`/api/channels${params}`);
  if (!res.ok) throw new Error('Failed to fetch channels');
  return res.json();
}
