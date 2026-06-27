export interface Channel {
  name: string;
  group: string;
  type: 'hls' | 'embed';
  url: string;
  poster?: string;
}

export interface ChannelsResponse {
  channels: Channel[];
  groups: string[];
}

export interface PpvStream {
  id: number;
  name: string;
  tag: string;
  poster: string;
  uri_name: string;
  starts_at: number;
  ends_at: number;
  always_live: number;
  category_name: string;
  iframe?: string;
  allowpaststreams: number;
}

export interface PpvCategory {
  category: string;
  id: number;
  always_live: number;
  streams: PpvStream[];
}

export interface PpvResponse {
  success: boolean;
  timestamp: number;
  performance: number;
  streams: PpvCategory[];
}
