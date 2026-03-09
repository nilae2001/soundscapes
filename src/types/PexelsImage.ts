export type PhotoSrc = {
  original: string;
  large: string;
  large2x: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
};

export type Photos = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PhotoSrc;
  alt: string;
};

export type PhotosRequest = {
  query: string;
  orientation: string | null;
  size: string | null;
  color: string | null;
  locale: string | null;
  page: number | null;
  per_page: number | null;
};

export type PhotosResponse = {
  photos: Photos[];
  page: number;
  per_page: number;
  total_results: number;
  prev_page: string | null;
  next_page: string | null;
};
