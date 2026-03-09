import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  Center,
  Skeleton,
  Stack,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Soundscape } from "../types/Soundscape";
import { SoundCard } from "../components/SoundCard";
import { useAuthStore } from "../store/useAuthStore";

export function MySoundsPage() {
  const [mySounds, setMySounds] = useState<Soundscape[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const { user, savedIds, loading: authLoading } = useAuthStore();

  useEffect(() => {
    async function fetchFullDetails() {
      if (authLoading) return;

      if (!user) {
        setLocalLoading(false);
        return;
      }

      const { data } = await supabase
        .from("soundscapes")
        .select(`*`)
        .eq("user_id", user.id);

      if (data) {
        setMySounds(data as Soundscape[]);
      }
      setLocalLoading(false);
    }

    fetchFullDetails();
  }, [user, authLoading, savedIds]);

  if (authLoading || localLoading) {
    return (
      <Container size="md" py={80}>
        <Stack gap="xs" mb={40}>
          <Skeleton height={12} width={120} radius="md" />
          <Skeleton height={48} width={240} radius="md" />
          <Skeleton height={16} width={100} radius="md" />
        </Stack>
        <Grid gutter="xl">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4 }}>
              <Skeleton height={220} radius="xl" />
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container size="md" py={80}>
      <Stack gap="xs" mb={40}>
        <Text className="text-accent font-bold tracking-widest uppercase text-xs">
          Library
        </Text>
        <Title order={1} className="text-5xl font-bold tracking-tighter">
          Your Sounds
        </Title>
        <Text c="dimmed">
          {mySounds.length} {mySounds.length === 1 ? "vibe" : "vibes"} ready for
          focus.
        </Text>
      </Stack>

      {mySounds.length > 0 ? (
        <Grid gutter="xl">
          {mySounds.map((sound) => (
            <Grid.Col key={sound.id} span={{ base: 12, sm: 6, md: 4 }}>
              <SoundCard sound={sound} />
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Center className="h-60 rounded-3xl border-2 border-dashed border-border flex-col p-10">
          <Text c="dimmed" mb="md">
            You haven't created any soundscapes yet.
          </Text>
          <Link
            to="/create"
            className="text-accent font-bold no-underline hover:underline"
          >
            Go create some vibes →
          </Link>
        </Center>
      )}
    </Container>
  );
}
