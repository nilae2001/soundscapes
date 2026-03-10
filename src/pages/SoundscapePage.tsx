import { useParams, Link } from "react-router-dom";
import {
  Container,
  Grid,
  Slider,
  Text,
  Title,
  ActionIcon,
  Group,
  Stack,
  Box,
  Image,
} from "@mantine/core";
import {
  IconVolume,
  IconPlayerPlay,
  IconPlayerPause,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconEdit,
} from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { Book } from "../types/Book";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

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
  profiles: {
    username: string;
  } | null;
}

export function SoundscapePage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user, savedIds, addSavedId, removeSavedId } = useAuthStore();

  const [soundscape, setSoundscape] = useState<SoundscapeWithProfile | null>(
    null,
  );
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  const isSaved = savedIds.includes(id || "");

  const isOwner = user?.id === (soundscape as any)?.user_id;

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    async function loadSoundData() {
      if (!id) return;

      const { data: sData } = await supabase
        .from("soundscapes")
        .select(
          `
    title,
    description,
    image_url,
    user_id,
    profiles (
      username
    )
  `,
        )
        .eq("id", id)
        .single();
      if (sData) setSoundscape(sData as any);

      const { data: junctionData, error: jError } = await supabase
        .from("soundscape_tracks")
        .select(
          `
    default_volume,
    tracks ( 
      id, 
      title, 
      audio_url 
    )
  `,
        )
        .eq("soundscape_id", id);

      if (jError) {
        if (import.meta.env.DEV)
          console.error("Error fetching tracks:", jError);
      }

      let userSettings: Record<string, number> = {};

      if (user && id) {
        const { data: saveData } = await supabase
          .from("saved_sounds")
          .select("settings")
          .eq("user_id", user.id)
          .eq("soundscape_id", id)
          .maybeSingle();

        if (saveData?.settings) {
          userSettings = saveData.settings as Record<string, number>;
        }
      }

      if (junctionData) {
        const tData = junctionData
          .filter((item: any) => item.tracks !== null)
          .map((item: any) => {
            const trackId = item.tracks.id;
            return {
              id: trackId,
              title: item.tracks.title,
              audio_url: item.tracks.audio_url,
              default_volume:
                userSettings[trackId] ?? item.default_volume ?? 0.5,
            };
          });

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
        .select(
          `
            books ( 
            id, 
            title, 
            authors, 
            thumbnail
            )
        `,
        )
        .eq("soundscape_id", id);

      if (bookJunctionData) {
        setBooks(bookJunctionData.map((item: any) => item.books));
      }
    }

    loadSoundData();

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRefs.current = {};
    };
  }, [id]);

  const toggleSave = async () => {
    if (!user) {
      notifications.show({
        title: "Login Required",
        message: "You need an account to save these vibes to your library.",
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

      const { error } = await supabase.from("saved_sounds").insert([
        {
          user_id: user.id,
          soundscape_id: id,
          settings: {},
        },
      ]);

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

  const toggleMasterPlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    Object.values(audioRefs.current).forEach((audio) => {
      nextState ? audio.play() : audio.pause();
    });
  };

  const handleVolumeChange = async (trackId: string, val: number) => {
    const normalizedVolume = val / 100;

    if (audioRefs.current[trackId]) {
      audioRefs.current[trackId].volume = normalizedVolume;
    }

    if (user && id && isSaved) {
      const { data } = await supabase
        .from("saved_sounds")
        .select("settings")
        .eq("user_id", user.id)
        .eq("soundscape_id", id)
        .maybeSingle();

      const newSettings = {
        ...((data?.settings as object) || {}),
        [trackId]: normalizedVolume,
      };

      await supabase
        .from("saved_sounds")
        .update({ settings: newSettings })
        .eq("user_id", user.id)
        .eq("soundscape_id", id);
    }
  };

  const handleDelete = () => {
    modals.openConfirmModal({
      title: "Delete this soundscape?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <b>{soundscape?.title}</b>? This
          action is permanent and cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete vibe", cancel: "No, keep it" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        // Verify ownership before delete
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

  return (
    <Box>
      <div className="relative w-full" style={{ minHeight: "30vh" }}>
        <div
          className="fixed-bg"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${soundscape?.image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
            bottom: 0,
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            width: "100%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            width: "100%",
            zIndex: 1,
            background:
              "linear-gradient(to top, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 50%, transparent) 50%, transparent 100%)",
          }}
        />

        <Container
          size="md"
          className="relative z-10 w-full pb-6"
          style={{ paddingTop: "30vh", zIndex: 2 }}
        >
          <Group
            justify="space-between"
            align="flex-end"
            wrap="nowrap"
            className="gap-8"
          >
            <Stack
              gap={2}
              className="flex-1 min-w-0 bg-bg/20 backdrop-blur-sm rounded-md px-5"
            >
              <Title className="text-3xl md:text-6xl font-bold tracking-tighter text-text-primary wrap-break-word overflow-hidden p-2">
                {soundscape?.title}
              </Title>

              <Group gap="sm" className="pt-4">
                <Text className="text-accent font-medium mt-2">created by</Text>
                <Text
                  size="sm"
                  className="text-accent font-medium mt-2 hover:underline cursor-pointer"
                  component={Link}
                  to={`/profile/${(soundscape as any)?.profiles?.username}`}
                >
                  @{(soundscape as any)?.profiles?.username || "anonymous"}
                </Text>

                {user?.id === (soundscape as any)?.user_id && (
                  <>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size={24}
                      onClick={() => navigate(`/edit/${id}`)}
                      title="Edit Soundscape"
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size={24}
                      onClick={handleDelete}
                      title="Delete Soundscape"
                    >
                      <IconTrash size={24} />
                    </ActionIcon>
                  </>
                )}
              </Group>

              {!isOwner && (
                <ActionIcon
                  variant="subtle"
                  color={isSaved ? "yellow" : "gray"}
                  size="xl"
                  onClick={toggleSave}
                  className="mt-4 hover:scale-110 transition-transform"
                >
                  {isSaved ? (
                    <IconStarFilled size={40} />
                  ) : (
                    <IconStar size={40} />
                  )}
                </ActionIcon>
              )}
              <Text className="text-xl text-text-secondary max-w-xl pt-5 pb-2">
                {soundscape?.description}
              </Text>
            </Stack>

            <ActionIcon
              size="100px"
              radius="100%"
              variant="filled"
              className="bg-accent hover:scale-105 transition-transform shadow-md shadow-accent/40"
              onClick={toggleMasterPlay}
            >
              {isPlaying ? (
                <IconPlayerPause size={50} />
              ) : (
                <IconPlayerPlay size={50} />
              )}
            </ActionIcon>
          </Group>
        </Container>
      </div>

      <Container size="md" py={80}>
        <Grid gutter={60} align="flex-start">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <div className="mb-8">
              <Text className="text-accent font-bold tracking-widest uppercase text-xs">
                Mixer
              </Text>
              <Title order={2} className="tracking-tight text-3xl">
                Adjust your environment
              </Title>
            </div>
            <Stack gap="md">
              {tracks.map((track) => (
                <Box
                  key={track.id}
                  className="p-8 bg-surface/50 backdrop-blur-md rounded-3xl border border-border transition-all hover:border-accent/30"
                >
                  <Group justify="space-between" mb="xl">
                    <Text className="text-xl font-medium tracking-tight">
                      {track.title}
                    </Text>
                    <IconVolume size={20} className="text-accent opacity-50" />
                  </Group>

                  <Slider
                    value={track.default_volume * 100}
                    onChange={(val) => {
                      setTracks((prev) =>
                        prev.map((t) =>
                          t.id === track.id
                            ? { ...t, default_volume: val / 100 }
                            : t,
                        ),
                      );
                      handleVolumeChange(track.id, val);
                    }}
                    color="blue"
                    size="md"
                    label={(value) => `${Math.round(value)}%`}
                    classNames={{
                      track: "bg-border h-2",
                      bar: "bg-accent",
                      thumb: "border-accent bg-white h-5 w-5",
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <div className="mb-8">
              <Text className="text-accent font-bold tracking-widest uppercase text-xs">
                Reading List
              </Text>
              <Title order={2} className="tracking-tight text-3xl">
                Books with this vibe
              </Title>
            </div>

            {books.length > 0 ? (
              <Stack gap="md">
                {books.map((book) => (
                  <Box
                    key={book.id}
                    component="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 bg-surface/30 rounded-2xl border border-border transition-all duration-300 hover:bg-surface/50 hover:border-accent/50 hover:-translate-y-1 hover:shadow-xl block no-underline"
                  >
                    <Group wrap="nowrap" align="center">
                      <Image
                        src={book.thumbnail}
                        w={70}
                        h={100}
                        fit="cover"
                        radius="md"
                        className="transition-transform duration-500 group-hover:scale-110"
                        fallbackSrc="https://placehold.co/70x100?text=No+Cover"
                      />

                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text
                          fw={700}
                          size="lg"
                          className="text-text-primary line-clamp-1 group-hover:text-accent transition-colors"
                        >
                          {book.title}
                        </Text>
                        <Text size="sm" className="text-text-secondary italic">
                          by{" "}
                          {Array.isArray(book.authors)
                            ? book.authors.join(", ")
                            : book.authors || "Unknown Author"}
                        </Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box className="h-40 rounded-3xl border-2 border-dashed border-border flex items-center justify-center italic text-text-secondary">
                No books added to this vibe yet.
              </Box>
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
