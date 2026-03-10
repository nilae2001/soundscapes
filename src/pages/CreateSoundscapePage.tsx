import {
  Button,
  Textarea,
  Stack,
  Container,
  Text,
  Title,
  Switch,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState, useEffect } from "react";
import { IconX } from "@tabler/icons-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { ImagePicker } from "../components/create/ImagePicker";
import { TrackSearch } from "../components/create/TrackSearch";
import { TrackList } from "../components/create/TrackList";
import { BookSearch } from "../components/create/BookSearch";
import type { PexelsPhoto } from "../types/Pexels";
import type { Track } from "../types/Tracks";

export default function CreateSoundscapePage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const [photoSelected, setPhotoSelected] = useState<PexelsPhoto | undefined>();
  const [selectedTracksList, setSelectedTracksList] = useState<Track[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      title: "",
      category: "",
      description: "",
      is_public: false,
    },
    validate: {
      title: (v) =>
        !v.trim()
          ? "Title is required"
          : v.length > 200
            ? "Max 200 chars"
            : null,
      category: (v) =>
        !v.trim()
          ? "Category is required"
          : v.length > 200
            ? "Max 200 chars"
            : null,
      description: (v) => (v && v.length > 300 ? "Max 300 chars" : null),
    },
  });

  useEffect(() => {
    if (!isEditMode || !id) return;
    async function loadExistingData() {
      const { data: soundscape } = await supabase
        .from("soundscapes")
        .select("*")
        .eq("id", id)
        .single();
      if (!soundscape) return;
      if (soundscape.user_id !== user?.id) {
        notifications.show({
          title: "Access Denied",
          message: "You can only edit your own soundscapes",
          color: "red",
        });
        navigate("/my-sounds");
        return;
      }
      form.setValues({
        title: soundscape.title,
        category: soundscape.category,
        description: soundscape.description || "",
        is_public: soundscape.is_public ?? false,
      });
      setPhotoSelected({
        id: 0,
        src: { original: soundscape.image_url, medium: soundscape.image_url },
      } as any);

      const { data: junctionData } = await supabase
        .from("soundscape_tracks")
        .select("default_volume, tracks ( id, title, audio_url )")
        .eq("soundscape_id", id)
        .limit(100);
      if (junctionData) {
        setSelectedTracksList(
          junctionData
            .map((item: any) => ({
              ...item.tracks,
              default_volume: item.default_volume ?? 0.5,
            }))
            .filter(Boolean) as Track[],
        );
      }

      const { data: bookJunctionData } = await supabase
        .from("soundscape_books")
        .select("books ( id, title, authors, thumbnail )")
        .eq("soundscape_id", id)
        .limit(100);
      if (bookJunctionData)
        setSelectedBooks(
          bookJunctionData.map((item: any) => item.books).filter(Boolean),
        );
    }
    loadExistingData();
  }, [id, isEditMode]);

  const handleVolumeChange = (trackId: string, value: number) => {
    const normalizedVolume = value / 100;
    setSelectedTracksList((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, default_volume: normalizedVolume } : t,
      ),
    );
  };

  const sanitize = (str: string) => str.replace(/<[^>]*>/g, "").trim();

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) {
      notifications.show({
        title: "Not logged in",
        message: "Please log in first.",
        color: "red",
      });
      navigate("/login");
      return;
    }
    if (!photoSelected) {
      notifications.show({
        title: "Missing Cover Image",
        message: "Please select a cover image.",
        color: "red",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      if (selectedBooks.length > 0) {
        const { error: bookError } = await supabase.from("books").upsert(
          selectedBooks.map((b) => ({
            id: b.id,
            title: b.title,
            authors: b.authors,
            thumbnail: b.thumbnail,
          })),
          { onConflict: "id" },
        );
        if (bookError) throw bookError;
      }

      const soundscapeData = {
        title: sanitize(values.title),
        category: sanitize(values.category),
        description: sanitize(values.description),
        is_public: values.is_public,
        image_url: (photoSelected as any).src.original,
        user_id: user?.id,
      };

      let soundscapeId = id;

      if (id) {
        const { error } = await supabase
          .from("soundscapes")
          .update(soundscapeData)
          .eq("id", id);
        if (error) throw error;
        await Promise.all([
          supabase.from("soundscape_tracks").delete().eq("soundscape_id", id),
          supabase.from("soundscape_books").delete().eq("soundscape_id", id),
        ]);
      } else {
        const { data: newSoundscape, error } = await supabase
          .from("soundscapes")
          .insert(soundscapeData)
          .select()
          .single();
        if (error) throw error;
        soundscapeId = newSoundscape.id;
      }

      await Promise.all([
        selectedTracksList.length > 0
          ? supabase
              .from("soundscape_tracks")
              .insert(
                selectedTracksList.map((t) => ({
                  soundscape_id: soundscapeId,
                  track_id: t.id,
                  default_volume: t.default_volume ?? 0.5,
                })),
              )
          : Promise.resolve(),
        selectedBooks.length > 0
          ? supabase
              .from("soundscape_books")
              .insert(
                selectedBooks.map((b) => ({
                  soundscape_id: soundscapeId,
                  book_id: b.id,
                })),
              )
          : Promise.resolve(),
      ]);

      if (id)
        notifications.show({
          title: "Vibe updated",
          message: `Successfully saved ${values.title}`,
          color: "green",
        });
      navigate(`/sound/${soundscapeId}`);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Save failed:", err);
      notifications.show({
        title: "Save failed",
        message: "Something went wrong.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="lg" py={40} px={{ base: 16, sm: 40, md: 80, lg: 200 }}>
      <Title className="text-3xl md:text-5xl font-sans font-bold tracking-tighter leading-[1.1] mb-2">
        {isEditMode ? "Edit Soundscape" : "Create Your Soundscape"}
      </Title>
      <Text size="lg" mb={40}>
        Curate Your Own Vibe
      </Text>

      <form
        onSubmit={form.onSubmit(
          (values) => handleSubmit(values),
          () =>
            notifications.show({
              title: "Check your fields",
              message: "Please fill in all required fields.",
              color: "red",
              icon: <IconX size={18} />,
            }),
        )}
        className="flex flex-col gap-6"
      >
        <Stack gap={40}>
          <Stack gap="xs">
            <TextInput
              label="Title"
              placeholder="Kazakh Steppe"
              {...form.getInputProps("title")}
              withAsterisk
              className="font-sans"
            />
            <TextInput
              label="Category"
              placeholder="e.g. Nature"
              {...form.getInputProps("category")}
              withAsterisk
              className="font-sans"
            />
            <Textarea
              label="Description"
              placeholder="Describe the vibe..."
              {...form.getInputProps("description")}
              className="font-sans"
            />
          </Stack>

          <ImagePicker
            photoSelected={photoSelected}
            onSelect={setPhotoSelected}
            onClear={() => setPhotoSelected(undefined)}
          />

          <hr className="border-white/10" />

          <TrackSearch
            onTrackSelected={(track) => {
              if (!selectedTracksList.some((t) => t.id === track.id))
                setSelectedTracksList((prev) => [...prev, track]);
            }}
          />

          <TrackList
            tracks={selectedTracksList}
            onVolumeChange={handleVolumeChange}
            onRemove={(trackId) =>
              setSelectedTracksList((prev) =>
                prev.filter((t) => t.id !== trackId),
              )
            }
          />

          <hr className="border-white/10" />

          <BookSearch
            selectedBooks={selectedBooks}
            onBookSelected={(book) =>
              setSelectedBooks((prev) => [...prev, book])
            }
            onBookRemoved={(bookId) =>
              setSelectedBooks((prev) => prev.filter((b) => b.id !== bookId))
            }
          />

          <Switch
            label="Make this soundscape public"
            description="Public soundscapes appear on the Explore page for everyone."
            {...form.getInputProps("is_public", { type: "checkbox" })}
            className="font-sans"
            color="var(--color-accent)"
          />

          <Button
            type="submit"
            size="lg"
            className="bg-accent font-sans font-medium"
            loading={isSubmitting}
          >
            {isEditMode ? "Update Soundscape" : "Create Soundscape"}
          </Button>
        </Stack>
      </form>
    </Container>
  );
}
