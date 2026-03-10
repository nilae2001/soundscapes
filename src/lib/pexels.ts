

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const pexels = {
  photos: {
    search: async (query: string) => {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/image-scout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ query }),
        }
      );
      return await response.json();
    },
  },
};