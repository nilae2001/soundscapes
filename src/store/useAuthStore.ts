import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null; 
  loading: boolean;
  savedIds: string[];
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void; 
  setSavedIds: (ids: string[]) => void;
  addSavedId: (id: string) => void;
  removeSavedId: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  savedIds: [],
  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile: Profile | null) => set({ profile }), 
  setSavedIds: (ids) => set({ savedIds: ids }),
  addSavedId: (id) => set((state) => ({ savedIds: [...state.savedIds, id] })),
  removeSavedId: (id) =>
    set((state) => ({
      savedIds: state.savedIds.filter((savedId) => savedId !== id),
    })),
  logout: () => set({ 
    user: null, 
    profile: null, 
    savedIds: [], 
    loading: false 
  }),
}));