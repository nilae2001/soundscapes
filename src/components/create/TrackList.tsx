import { Stack, Group, Text, Button, Slider } from "@mantine/core";
import { IconX, IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";
import { useRef, useState } from "react";
import type { Track } from "../../types/Tracks";

interface TrackListProps {
  tracks: Track[];
  onVolumeChange: (trackId: string, value: number) => void;
  onRemove: (trackId: string) => void;
}

export function TrackList({
  tracks,
  onVolumeChange,
  onRemove,
}: TrackListProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

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
        const track = tracks.find((t) => t.id === trackId);
        if (track) audio.volume = track.default_volume ?? 0.5;
        audio.play().catch((e) => {
          if (import.meta.env.DEV) console.error("Playback failed", e);
        });
      });
      setIsPreviewing(true);
    }
  };

  if (tracks.length === 0) return null;

  return (
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

      {tracks.map((track) => (
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
                onChange={(val) => onVolumeChange(track.id, val)}
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
                  if (el.volume !== targetVol) el.volume = targetVol;
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
              onRemove(track.id);
            }}
          />
        </Group>
      ))}
    </Stack>
  );
}
