export type Track = {
  id: string;
  title: string;
  audio_url: string;
  default_volume: number;
};

export type Tracks = {
  tracks: Track[];
};
