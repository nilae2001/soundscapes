import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Stack,
  Avatar,
  Skeleton,
  Grid,
} from "@mantine/core";
import { supabase } from "../lib/supabase";
import { SoundCard } from "../components/SoundCard";
import type { Soundscape } from "../types/Soundscape";

export function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [sounds, setSounds] = useState<Soundscape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileAndSounds() {
      setLoading(true);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("username", username)
        .single();

      if (profileData) {
        setProfile(profileData);

        const { data: soundsData } = await supabase
          .from("soundscapes")
          .select("*")
          .eq("user_id", profileData.id)
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        if (soundsData) setSounds(soundsData);
      }
      setLoading(false);
    }
    fetchProfileAndSounds();
  }, [username]);

  if (loading)
    return (
      <Container size="lg" py={80}>
        <Stack align="center" mb={50}>
          <Skeleton height={120} circle />
          <Skeleton height={32} width={200} radius="md" />
          <Skeleton height={16} width={140} radius="md" />
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
  if (!profile) return <Text p="xl">User not found.</Text>;

  return (
    <Container size="lg" py={80}>
      <Stack align="center" mb={50}>
        <Avatar src={profile.avatar_url} size={120} radius={120} />
        <Title order={1}>@{profile.username}</Title>
        <Text color="dimmed">{sounds.length} Public Soundscapes</Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
        {sounds.map((sound) => (
          <SoundCard key={sound.id} sound={sound} />
        ))}
      </SimpleGrid>
    </Container>
  );
}
