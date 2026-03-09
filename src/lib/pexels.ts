const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;
const BASE = "https://api.pexels.com/v1";

const headers = {
  Authorization: pexelsKey,
  "Content-Type": "application/json",
};

export const pexels = {
  photos: {
    search: async (params: Record<string, string | number>) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const r = await fetch(`${BASE}/search?${query}`, { headers });
          return await r.json();
    },
    curated: async (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const r = await fetch(`${BASE}/curated?${query}`, { headers });
        return await r.json();
    },
    show: async (id: number) => {
      const r = await fetch(`${BASE}/photos/${id}`, { headers });
        return await r.json();
    },
  },
  videos: {
    search: (params: Record<string, string | number>) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return fetch(`https://api.pexels.com/videos/search?${query}`, { headers }).then(r => r.json());
    },
  },
};