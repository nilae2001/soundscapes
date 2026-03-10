import {
  TextInput,
  Stack,
  Text,
  Box,
  Group,
  Button,
  Loader,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { Track } from "../../types/Tracks";

interface TrackSearchProps {
  onTrackSelected: (track: Track) => void;
}

export function TrackSearch({ onTrackSelected }: TrackSearchProps) {
  const [trackQuery, setTrackQuery] = useState("");
  const [aiFoundTracks, setAiFoundTracks] = useState<any[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    let active = true;
    if (!trackQuery.trim()) {
      setAiFoundTracks([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (trackQuery.trim().length < 3) return;
      setIsAiSearching(true);
      const AUDIO_SCOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audio-scout`;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch(AUDIO_SCOUT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userPrompt: trackQuery.trim() }),
        });

        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          setAiFoundTracks(data.suggestions || []);
        } else {
          setAiFoundTracks([]);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Audio Scout fetch error:", err);
        if (active) setAiFoundTracks([]);
      } finally {
        if (active) setIsAiSearching(false);
      }
    }, 1000);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [trackQuery]);

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

    if (newTrack) {
      onTrackSelected(newTrack);
      setTrackQuery("");
      setAiFoundTracks([]);
    }
  };

  return (
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

      {aiFoundTracks
        .filter((item) => item.sound?.name)
        .map((item) => (
          <Box
            key={item.sound.id}
            p="md"
            style={{
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={4} style={{ flex: 1 }}>
                <Group gap={6}>
                  <IconSparkles size={14} color="var(--color-accent)" />
                  <Text size="sm" fw={600}>
                    {item.sound.name}
                  </Text>
                </Group>
                <Text size="xs" lineClamp={2}>
                  "{item.ai_reason}"
                </Text>
                <audio
                  controls
                  controlsList="nodownload"
                  style={{ height: "30px", marginTop: "8px", width: "100%" }}
                >
                  <source
                    src={item.sound.previews["preview-lq-mp3"]}
                    type="audio/mpeg"
                  />
                </audio>
              </Stack>
              <Button
                type="button"
                variant="light"
                color="var(--color-accent)"
                size="compact-xs"
                onClick={() => handleAiSelection(item)}
              >
                Add +
              </Button>
            </Group>
          </Box>
        ))}
    </Stack>
  );
}
