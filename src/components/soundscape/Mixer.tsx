import { Stack, Box, Group, Text, Title, Slider } from "@mantine/core";
import { IconVolume } from "@tabler/icons-react";

interface Track {
  id: string;
  title: string;
  default_volume: number;
}

interface Props {
  tracks: Track[];
  onVolumeChange: (trackId: string, val: number) => void;
}

export function Mixer({ tracks, onVolumeChange }: Props) {
  return (
    <div>
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
              onChange={(val) => onVolumeChange(track.id, val)}
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
    </div>
  );
}
