export interface StreamSource {
  tag: string;
  url: string;
}

export interface Channel {
  name: string;
  group: string;
  type: 'hls' | 'embed';
  url: string;
  poster?: string;
  sources?: StreamSource[];
  startsAt?: number;
  endsAt?: number;
}

export interface ChannelsResponse {
  channels: Channel[];
  groups: string[];
}

export interface PpvSubstream {
  id: number;
  name: string;
  tag: string;
  source_tag: string;
  uri_name: string;
  iframe: string;
}

export interface PpvStream {
  id: number;
  name: string;
  tag: string;
  source_tag?: string;
  poster: string;
  uri_name: string;
  starts_at: number;
  ends_at: number;
  always_live: number;
  category_name: string;
  iframe?: string;
  allowpaststreams: number;
  substreams?: PpvSubstream[];
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
