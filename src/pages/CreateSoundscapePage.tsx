import {
  Button,
  Textarea,
  Group,
  TextInput,
  Stack,
  Container,
  Grid,
  Text,
  Image,
  ScrollArea,
  Box,
  Title,
  Loader,
  Slider,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState, useEffect } from "react";
import { pexels } from "../lib/pexels";
import type { PexelsPhoto, PexelsPhotoResults } from "../types/Pexels";
import type { Track } from "../types/Tracks";
import { supabase } from "../lib/supabase";
import {
  IconX,
  IconSparkles,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useRef } from "react";

export default function CreateSoundscapePage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PexelsPhotoResults | undefined>();

  const [trackQuery, setTrackQuery] = useState("");
  const [bookQuery, setBookQuery] = useState("");

  const [foundBooks, setFoundBooks] = useState<any[]>([]);
  const [isBookSearching, setIsBookSearching] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<any[]>([]);

  const [aiFoundTracks, setAiFoundTracks] = useState<any[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photoSelected, setPhotoSelected] = useState<PexelsPhoto | undefined>();
  const [selectedTracksList, setSelectedTracksList] = useState<Track[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const togglePreview = () => {
    if (isPreviewing) {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setIsPreviewing(false);
    } else {
      Object.keys(audioRefs.current).forEach((trackId) => {
        const audio = audioRefs.current[trackId];
        const trackState = selectedTracksList.find((t) => t.id === trackId);
        if (trackState) {
          audio.volume = trackState.default_volume ?? 0.5;
        }
        audio.play().catch((e) => console.error("Playback failed", e));
      });
      setIsPreviewing(true);
    }
  };

  const handleVolumeChange = (trackId: string, value: number) => {
    const normalizedVolume = value / 100;

    setSelectedTracksList((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, default_volume: normalizedVolume } : t,
      ),
    );

    if (audioRefs.current[trackId]) {
      audioRefs.current[trackId].volume = normalizedVolume;
    }
  };

  useEffect(() => {
    if (isEditMode && id) {
      async function loadExistingData() {
        const { data: soundscape } = await supabase
          .from("soundscapes")
          .select("*")
          .eq("id", id)
          .single();

        if (soundscape) {
          form.setValues({
            title: soundscape.title,
            category: soundscape.category,
            description: soundscape.description || "",
            is_public: soundscape.is_public ?? false,
          });

          setPhotoSelected({
            id: 0,
            src: {
              original: soundscape.image_url,
              medium: soundscape.image_url,
            },
          } as any);
        }

        const { data: junctionData } = await supabase
          .from("soundscape_tracks")
          .select(
            `
    default_volume, 
    tracks ( id, title, audio_url )
  `,
          )
          .eq("soundscape_id", id);

        if (junctionData) {
          const flatTracks = junctionData
            .map((item: any) => ({
              ...item.tracks,
              default_volume: item.default_volume ?? 0.5,
            }))
            .filter(Boolean) as unknown as Track[];

          setSelectedTracksList(flatTracks);
        }

        const { data: bookJunctionData } = await supabase
          .from("soundscape_books")
          .select(`books ( id, title, authors, thumbnail )`)
          .eq("soundscape_id", id);

        if (bookJunctionData) {
          const flatBooks = bookJunctionData
            .map((item) => item.books)
            .filter(Boolean);
          setSelectedBooks(flatBooks);
        }
      }
      loadExistingData();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (!bookQuery.trim() || bookQuery.length < 3) {
      setFoundBooks([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsBookSearching(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch(
          "https://ezvmqabfyjwvnrwhsjeg.supabase.co/functions/v1/book-scout",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ userPrompt: bookQuery.trim() }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setFoundBooks(data.suggestions);
        }
      } catch (err) {
        console.error("Book Scout failed:", err);
      } finally {
        setIsBookSearching(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [bookQuery]);

  useEffect(() => {
    let active = true;
    async function loadPhotos() {
      if (!query.trim()) {
        setPhotos(undefined);
        return;
      }
      try {
        const response = await pexels.photos.search({ query: query });
        if (active) setPhotos(response);
      } catch (error) {
        console.error("Pexels fetch failed: " + error);
      }
    }
    loadPhotos();
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (!trackQuery.trim()) {
      setAiFoundTracks([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (trackQuery.trim().length < 3) return;
      setIsAiSearching(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch(
          "https://ezvmqabfyjwvnrwhsjeg.supabase.co/functions/v1/audio-scout",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ userPrompt: trackQuery.trim() }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          setAiFoundTracks(data.suggestions);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsAiSearching(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [trackQuery]);

  const form = useForm({
    initialValues: {
      title: "",
      category: "",
      description: "",
      is_public: false,
    },
    validate: {
      title: (value) =>
        !value.trim()
          ? "Title is required"
          : value.length > 200
            ? "Title must be 200 chars or less"
            : null,
      category: (value) =>
        !value.trim()
          ? "Category is required"
          : value.length > 200
            ? "Category must be 200 chars or less"
            : null,
      description: (value) =>
        value && value.length > 300
          ? "Description must be 300 chars or less"
          : null,
    },
  });

  const handleTrackListSelection = (track: Track) => {
    if (selectedTracksList.some((t) => t.id === track.id)) return;
    setSelectedTracksList([...selectedTracksList, track]);
    setTrackQuery("");
    setAiFoundTracks([]);
  };

  const handleAiSelection = async (item: any) => {
    const { sound } = item;
    const { data: newTrack } = await supabase
      .from("tracks")
      .insert({
        title: sound.name,
        audio_url: sound.previews["preview-hq-mp3"],
        is_external: true,
        external_id: sound.id.toString(),
        default_volume: 0.5,
      })
      .select()
      .single();

    if (newTrack) handleTrackListSelection(newTrack);
  };

  const handleBookSelection = (book: any) => {
    if (selectedBooks.some((b) => b.id === book.id)) return;
    setSelectedBooks([...selectedBooks, book]);
    setBookQuery("");
    setFoundBooks([]);
  };

  const handleSubmit = async (values: typeof form.values) => {
    console.log("form submitted");
    if (!photoSelected) {
      notifications.show({
        title: "Missing Cover Image",
        message: "Please search for and select a cover image from Pexels.",
        color: "red",
      });
      return;
    }
    setIsSubmitting(true);

    try {
      if (selectedBooks.length > 0) {
        const booksToUpsert = selectedBooks.map((book) => ({
          id: book.id,
          title: book.title,
          authors: book.authors,
          thumbnail: book.thumbnail,
        }));

        const { error: bookError } = await supabase
          .from("books")
          .upsert(booksToUpsert, { onConflict: "id" });

        if (bookError) throw bookError;
      }

      const soundscapeData = {
        title: values.title,
        category: values.category,
        description: values.description,
        is_public: values.is_public,
        image_url: (photoSelected as any).src.original,
        user_id: user?.id,
      };

      let soundscapeId = id;

      if (id) {
        const { error: updateError } = await supabase
          .from("soundscapes")
          .update(soundscapeData)
          .eq("id", id);
        if (updateError) throw updateError;

        await Promise.all([
          supabase.from("soundscape_tracks").delete().eq("soundscape_id", id),
          supabase.from("soundscape_books").delete().eq("soundscape_id", id),
        ]);
      } else {
        const { data: newSoundscape, error: insertError } = await supabase
          .from("soundscapes")
          .insert(soundscapeData)
          .select()
          .single();
        if (insertError) throw insertError;
        soundscapeId = newSoundscape.id;
      }

      const trackLinks = selectedTracksList.map((track) => ({
        soundscape_id: soundscapeId,
        track_id: track.id,
        default_volume: track.default_volume ?? 0.5,
      }));

      const bookLinks = selectedBooks.map((book) => ({
        soundscape_id: soundscapeId,
        book_id: book.id,
      }));

      await Promise.all([
        trackLinks.length > 0
          ? supabase.from("soundscape_tracks").insert(trackLinks)
          : Promise.resolve(),
        bookLinks.length > 0
          ? supabase.from("soundscape_books").insert(bookLinks)
          : Promise.resolve(),
      ]);

      if (id) {
        notifications.show({
          title: "Vibe updated",
          message: `Successfully saved ${values.title}`,
          color: "green",
        });
      }

      navigate(`/sound/${soundscapeId}`);
    } catch (err) {
      console.error("Save failed:", err);
      notifications.show({
        title: "Save failed",
        message: "Check console for details.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="lg" py={80} px={200}>
      <Box mb={40}>
        <Title className="text-5xl font-sans font-bold tracking-tighter leading-[1.1] mb-2">
          Create Your Soundscape
        </Title>
        <Text size="lg">Curate Your Own Vibe</Text>
      </Box>

      <Stack gap={40}>
        <form
          onSubmit={form.onSubmit(
            (values) => handleSubmit(values),
            (validationErrors) => {
              notifications.show({
                title: "Check your fields",
                message: "Please fill in all required fields before saving.",
                color: "red",
                icon: <IconX size={18} />,
              });
              console.log("Validation failed:", validationErrors);
            },
          )}
          className="flex flex-col gap-6"
        >
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

          {photoSelected ? (
            <Stack>
              <Text fw={600}>Selected Image</Text>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                  <Image
                    src={photoSelected.src.original}
                    radius="md"
                    className="cursor-pointer w-75 mb-2"
                  />
                  <Button
                    type="button"
                    className="bg-accent font-sans font-medium"
                    onClick={() => setPhotoSelected(undefined)}
                  >
                    Choose a different photo
                  </Button>
                </Grid.Col>
              </Grid>
            </Stack>
          ) : (
            <Stack>
              <TextInput
                label="Search Cover Image"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Pexels..."
                className="font-sans"
              />
              {photos && "photos" in photos && (
                <ScrollArea h={400} scrollbars="y">
                  <div style={{ columnCount: 3, columnGap: "1rem" }}>
                    {photos.photos.map((photo: PexelsPhoto) => (
                      <div
                        key={photo.id}
                        style={{ marginBottom: "1rem", breakInside: "avoid" }}
                      >
                        <Image
                          src={photo.src.medium}
                          radius="md"
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setPhotoSelected(photo);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Stack>
          )}

          <hr className="border-white/10" />

          <Stack gap="xs">
            <TextInput
              label="Add Sounds"
              description="Type to let AI scout Freesound"
              placeholder="e.g. Rain, Wind, Lo-fi..."
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.currentTarget.value)}
              rightSection={isAiSearching ? <Loader size="xs" /> : null}
              className="font-sans"
            />

            {aiFoundTracks.length > 0 && (
              <Stack gap="sm">
                <Text
                  size="xs"
                  fw={700}
                  tt="uppercase"
                  lts={1}
                  style={{ color: "var(--color-accent)" }}
                  className="font-sans"
                >
                  AI Scout suggestions
                </Text>

                {aiFoundTracks.map((item) => (
                  <Box
                    key={item.sound.id}
                    p="md"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <Group
                      justify="space-between"
                      align="flex-start"
                      wrap="nowrap"
                    >
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap={6}>
                          <IconSparkles size={14} color="var(--color-accent)" />
                          <Text size="sm" fw={600} className="font-medium">
                            {item.sound.name}
                          </Text>
                        </Group>
                        <Text size="xs" lineClamp={2} className="font-medium">
                          "{item.ai_reason}"
                        </Text>

                        <audio
                          controls
                          controlsList="nodownload"
                          style={{
                            height: "30px",
                            marginTop: "8px",
                            width: "100%",
                          }}
                        >
                          <source
                            src={item.sound.previews["preview-lq-mp3"]}
                            type="audio/mpeg"
                            className="font-sans"
                          />
                          Your browser does not support the audio element.
                        </audio>
                      </Stack>

                      <Button
                        type="button"
                        variant="light"
                        color="var(--color-accent)"
                        size="compact-xs"
                        onClick={() => handleAiSelection(item)}
                        className="font-sans"
                      >
                        Add +
                      </Button>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>

          {selectedTracksList.length > 0 && (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase">
                  Your Layers
                </Text>
                <Button
                  type="button"
                  size="compact-xs"
                  variant="light"
                  className="font-sans"
                  color={isPreviewing ? "red" : "green"}
                  leftSection={
                    isPreviewing ? (
                      <IconPlayerPause size={14} />
                    ) : (
                      <IconPlayerPlay size={14} />
                    )
                  }
                  onClick={togglePreview}
                >
                  {isPreviewing ? "Stop Preview" : "Play All Mix"}
                </Button>
              </Group>

              {selectedTracksList.map((track) => (
                <Group
                  key={track.id}
                  p="md"
                  className="bg-white/5 rounded-md border border-white/10"
                  wrap="nowrap"
                >
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text size="sm" fw={600}>
                      {track.title}
                    </Text>

                    <Group gap="md">
                      <Text size="xs" c="dimmed" w={80}>
                        Default Volume
                      </Text>
                      <Slider
                        style={{ flex: 1 }}
                        size="sm"
                        color="var(--color-accent)"
                        label={(value) => `${value}%`}
                        value={(track.default_volume || 0.5) * 100}
                        onChange={(val) => handleVolumeChange(track.id, val)}
                      />
                      <Text size="xs" w={30}>
                        {Math.round((track.default_volume || 0.5) * 100)}%
                      </Text>
                    </Group>

                    <audio
                      ref={(el) => {
                        if (el) {
                          audioRefs.current[track.id] = el;
                          const targetVol = track.default_volume ?? 0.5;
                          if (el.volume !== targetVol) {
                            el.volume = targetVol;
                          }
                          el.loop = true;
                        }
                      }}
                      src={track.audio_url}
                    />
                  </Stack>

                  <IconX
                    size={18}
                    className="cursor-pointer text-red-400 hover:text-red-500"
                    onClick={() => {
                      if (audioRefs.current[track.id]) {
                        audioRefs.current[track.id].pause();
                        delete audioRefs.current[track.id];
                      }
                      setSelectedTracksList(
                        selectedTracksList.filter((t) => t.id !== track.id),
                      );
                    }}
                  />
                </Group>
              ))}
            </Stack>
          )}

          <hr className="border-white/10" />

          <Stack gap="xs">
            <TextInput
              label="Add Books"
              placeholder="Search books..."
              value={bookQuery}
              onChange={(e) => setBookQuery(e.currentTarget.value)}
              rightSection={isBookSearching && <Loader size="xs" />}
              className="font-sans"
            />
            {foundBooks.map((book) => (
              <Box
                key={book.id}
                p="md"
                className="border border-white/10 bg-white/5 rounded-md"
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm">
                    <Image src={book.thumbnail} w={30} h={45} />
                    <Text size="sm" fw={600} lineClamp={1}>
                      {book.title}
                      {book.authors?.length > 0
                        ? ` by ${book.authors.join(", ")}`
                        : ""}
                    </Text>
                  </Group>
                  <Button
                    type="button"
                    variant="light"
                    color="var(--color-accent)"
                    size="compact-xs"
                    onClick={() => handleBookSelection(book)}
                    className="font-sans"
                  >
                    Add +
                  </Button>
                </Group>
              </Box>
            ))}

            {selectedBooks.length > 0 && (
              <Stack gap="xs" mt="md">
                <Text size="xs" fw={700} tt="uppercase">
                  Your Books
                </Text>
                {selectedBooks.map((book) => (
                  <Group
                    key={book.id}
                    justify="space-between"
                    p="xs"
                    className="bg-white/5 rounded-md border border-white/10"
                  >
                    <Group gap="sm">
                      <Image src={book.thumbnail} w={20} h={30} />
                      <Text size="sm">
                        {book.title}{" "}
                        {book.authors?.length > 0
                          ? ` by ${book.authors.join(", ")}`
                          : ""}
                      </Text>
                    </Group>
                    <IconX
                      size={16}
                      className="cursor-pointer text-red-400"
                      onClick={() =>
                        setSelectedBooks(
                          selectedBooks.filter((b) => b.id !== book.id),
                        )
                      }
                    />
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>

          <Switch
            label="Make this soundscape public"
            description="Public soundscapes appear on the Explore page for everyone."
            {...form.getInputProps("is_public", { type: "checkbox" })}
            className="font-sans"
            color="var(--color-accent)"
          />

          <Button
            type="submit"
            mt="xl"
            size="lg"
            className="bg-accent font-sans font-medium"
            loading={isSubmitting}
          >
            {isEditMode ? "Update Soundscape" : "Create Soundscape"}
          </Button>
        </form>
      </Stack>
    </Container>
  );
}
