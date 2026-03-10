import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import type { Book } from "../types/Book";

interface Track {
  id: string;
  title: string;
  audio_url: string;
  default_volume: number;
}

interface SoundscapeWithProfile {
  title: string;
  description: string;
  image_url: string;
  user_id: string;
  profiles: { username: string } | null;
}

export function useSoundscape(id: string | undefined) {
  const navigate = useNavigate();
  const { user, savedIds, addSavedId, removeSavedId } = useAuthStore();

  const [soundscape, setSoundscape] = useState<SoundscapeWithProfile | null>(
    null,
  );
  const [tracks, setTracks] = useState<Track[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const isSaved = savedIds.includes(id || "");
  const isOwner = user?.id === (soundscape as any)?.user_id;

  useEffect(() => {
    async function loadSoundData() {
      if (!id) return;

      const { data: sData } = await supabase
        .from("soundscapes")
        .select("title, description, image_url, user_id, profiles ( username )")
        .eq("id", id)
        .single();
      if (sData) setSoundscape(sData as any);

      const { data: junctionData, error: jError } = await supabase
        .from("soundscape_tracks")
        .select("default_volume, tracks ( id, title, audio_url )")
        .eq("soundscape_id", id);
      if (jError && import.meta.env.DEV)
        console.error("Error fetching tracks:", jError);

      let userSettings: Record<string, number> = {};
      if (user && id) {
        const { data: saveData } = await supabase
          .from("saved_sounds")
          .select("settings")
          .eq("user_id", user.id)
          .eq("soundscape_id", id)
          .maybeSingle();
        if (saveData?.settings)
          userSettings = saveData.settings as Record<string, number>;
      }

      if (junctionData) {
        const tData = junctionData
          .filter((item: any) => item.tracks !== null)
          .map((item: any) => ({
            id: item.tracks.id,
            title: item.tracks.title,
            audio_url: item.tracks.audio_url,
            default_volume:
              userSettings[item.tracks.id] ?? item.default_volume ?? 0.5,
          }));

        setTracks(tData);
        tData.forEach((track) => {
          if (!audioRefs.current[track.id]) {
            const audio = new Audio(track.audio_url);
            audio.loop = true;
            audio.volume = track.default_volume;
            audioRefs.current[track.id] = audio;
          }
        });
      }

      const { data: bookJunctionData } = await supabase
        .from("soundscape_books")
        .select("books ( id, title, authors, thumbnail )")
        .eq("soundscape_id", id);
      if (bookJunctionData)
        setBooks(bookJunctionData.map((item: any) => item.books));
    }

    loadSoundData();
    return () => {
      Object.values(audioRefs.current).forEach((a) => {
        a.pause();
        a.src = "";
      });
      audioRefs.current = {};
    };
  }, [id]);

  const toggleMasterPlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    Object.values(audioRefs.current).forEach((a) =>
      next ? a.play() : a.pause(),
    );
  };

  const handleVolumeChange = async (trackId: string, val: number) => {
    const volume = val / 100;
    if (audioRefs.current[trackId]) audioRefs.current[trackId].volume = volume;
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, default_volume: volume } : t,
      ),
    );

    if (user && id && isSaved) {
      const { data } = await supabase
        .from("saved_sounds")
        .select("settings")
        .eq("user_id", user.id)
        .eq("soundscape_id", id)
        .maybeSingle();
      await supabase
        .from("saved_sounds")
        .update({
          settings: {
            ...((data?.settings as object) || {}),
            [trackId]: volume,
          },
        })
        .eq("user_id", user.id)
        .eq("soundscape_id", id);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      notifications.show({
        title: "Login Required",
        message: "You need an account to save these vibes.",
        color: "var(--color-accent)",
        position: "bottom-right",
        autoClose: 4000,
      });
      return;
    }
    if (!id) return;

    if (isSaved) {
      removeSavedId(id);
      const { error } = await supabase
        .from("saved_sounds")
        .delete()
        .eq("user_id", user.id)
        .eq("soundscape_id", id);
      if (error) {
        addSavedId(id);
        notifications.show({
          title: "Error",
          message: "Failed to remove from library.",
          color: "red",
        });
      }
    } else {
      addSavedId(id);
      const { error } = await supabase
        .from("saved_sounds")
        .insert([{ user_id: user.id, soundscape_id: id, settings: {} }]);
      if (error) {
        removeSavedId(id);
        notifications.show({
          title: "Error",
          message: "Failed to save to library.",
          color: "red",
        });
      } else {
        notifications.show({
          title: "Vibe Saved",
          message: "This soundscape is now in your collection.",
          color: "teal",
          position: "bottom-right",
        });
      }
    }
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: "Delete this soundscape?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <b>{soundscape?.title}</b>? This is
          permanent.
        </Text>
      ),
      labels: { confirm: "Delete vibe", cancel: "No, keep it" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (soundscape?.user_id !== user?.id) {
          notifications.show({
            title: "Access Denied",
            message: "You can only delete your own soundscapes",
            color: "red",
          });
          return;
        }
        const { error } = await supabase
          .from("soundscapes")
          .delete()
          .eq("id", id)
          .eq("user_id", user?.id);
        if (error) {
          notifications.show({
            title: "Error",
            message: error.message,
            color: "red",
            position: "bottom-right",
          });
        } else {
          notifications.show({
            title: "Deleted",
            message: "Vibe has been removed forever.",
            color: "blue",
            position: "bottom-right",
          });
          navigate("/");
        }
      },
    });
  };

  return {
    soundscape,
    tracks,
    books,
    isPlaying,
    isSaved,
    isOwner,
    toggleMasterPlay,
    handleVolumeChange,
    toggleSave,
    handleDelete,
  };
}
