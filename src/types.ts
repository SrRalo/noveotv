export interface Channel {
  name: string;
  group: string;
  type: 'hls' | 'embed';
  url: string;
}

export interface ChannelsResponse {
  channels: Channel[];
  groups: string[];
}
