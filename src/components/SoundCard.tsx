import { Text, Title, Paper, ActionIcon, Skeleton } from "@mantine/core";
import { Link } from "react-router-dom";
import type { Soundscape } from "../types/Soundscape";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";
import { IconStarFilled, IconStar } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

interface SoundCardProps {
  sound: Soundscape;
}

export function SoundCard({ sound }: SoundCardProps) {
  const { user, savedIds, addSavedId, removeSavedId } = useAuthStore();
  const [imageLoaded, setImageLoaded] = useState(false);

  const isSaved = savedIds.includes(sound.id);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user)
      return notifications.show({
        title: "Login Required",
        message: "You need an account to save these vibes to your library.",
        color: "var(--color-accent)",
        position: "bottom-right",
        autoClose: 4000,
      });

    if (isSaved) {
      removeSavedId(sound.id);
      await supabase
        .from("saved_sounds")
        .delete()
        .eq("soundscape_id", sound.id);
    } else {
      addSavedId(sound.id);
      await supabase
        .from("saved_sounds")
        .insert([{ user_id: user.id, soundscape_id: sound.id }]);
    }
  };
  return (
    <Link to={`/sound/${sound.id}`} className="no-underline">
      <Paper
        shadow="md"
        radius="lg"
        className="group relative h-110 flex flex-col justify-end overflow-hidden cursor-pointer border-none"
      >
        <img
          src={sound.image_url}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          loading="eager"
          className="hidden"
          aria-hidden
        />

        {!imageLoaded && (
          <Skeleton className="absolute inset-0" radius="lg" height="100%" />
        )}

        <img
          src={sound.image_url}
          alt={sound.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

        <div className="relative z-10 translate-y-4 transition-transform duration-500 group-hover:translate-y-0 will-change-transform p-5">
          <div className="flex flex-row items-center gap-2">
            <Title order={3} className="text-white mb-2 tracking-tight">
              {sound.title}
            </Title>
            {user?.id === sound.user_id ? (
              <></>
            ) : (
              <ActionIcon
                variant="subtle"
                color={isSaved ? "yellow" : "gray"}
                size="sm"
                onClick={toggleSave}
                className="hover:scale-110 transition-transform mb-2"
              >
                {isSaved ? (
                  <IconStarFilled size={20} />
                ) : (
                  <IconStar size={20} />
                )}
              </ActionIcon>
            )}
          </div>
          <Text className="text-white/70 text-sm line-clamp-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            {sound.description}
          </Text>
        </div>
      </Paper>
    </Link>
  );
}
