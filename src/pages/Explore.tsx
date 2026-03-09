import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Text,
  Box,
  Stack,
  Skeleton,
  Grid,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { supabase } from "../lib/supabase";
import type { Soundscape } from "../types/Soundscape";
import { SoundCard } from "../components/SoundCard";

export function ExplorePage() {
  const [categories, setCategories] = useState<Record<string, Soundscape[]>>(
    {},
  );

  const [isLoading, setIsLoading] = useState(true);

  const ALLOWED_CATEGORIES = [
    "Nature",
    "City",
    "Cozy / Indoor",
    "Study / Focus",
    "Travel / World",
    "Ambient / Electronic",
  ];

  const CATEGORY_ALIASES: Record<string, string> = {
    nature: "Nature",
    city: "City",
    urban: "City",
    cozy: "Cozy / Indoor",
    indoor: "Cozy / Indoor",
    "cozy / indoor": "Cozy / Indoor",
    study: "Study / Focus",
    focus: "Study / Focus",
    "study / focus": "Study / Focus",
    travel: "Travel / World",
    world: "Travel / World",
    "travel / world": "Travel / World",
    ambient: "Ambient / Electronic",
    electronic: "Ambient / Electronic",
    "ambient / electronic": "Ambient / Electronic",
  };

  function normalizeCategory(raw: string): string {
    const key = raw.trim().toLowerCase();
    return CATEGORY_ALIASES[key] ?? "Other";
  }

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      const { data } = await supabase.from("soundscapes").select("*");

      if (data) {
        const publicSounds = data.filter((item) => {
          const isOfficial = item.user_id === null;
          const isPublic = item.is_public === true;
          return isOfficial || isPublic;
        });

        const grouped = publicSounds.reduce(
          (acc, item) => {
            const cat = normalizeCategory(item.category || "");
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
          },
          {} as Record<string, Soundscape[]>,
        );

        const sorted: Record<string, Soundscape[]> = {};
        for (const cat of ALLOWED_CATEGORIES) {
          if (grouped[cat]) sorted[cat] = grouped[cat];
        }
        if (grouped["Other"]) sorted["Other"] = grouped["Other"];

        setCategories(sorted);
      }

      setIsLoading(false);
    }
    fetchAll();
  }, []);

  if (isLoading) {
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
    <Container size="lg" py={80}>
      <Stack gap={50}>
        <Box>
          <Title className="text-5xl font-sans font-bold tracking-tighter leading-[1.1] mb-2">
            Explore Sounds
          </Title>
          <Text size="lg">
            Find the perfect atmosphere for your focus and vibe.
          </Text>
        </Box>

        {Object.entries(categories).map(([categoryName, sounds]) => (
          <Box key={categoryName}>
            <Title order={2} mb="xl" className="tracking-tight capitalize">
              {categoryName}
            </Title>

            <Carousel
              slideSize={{ base: "100%", sm: "50%", md: "33.3333%" }}
              slideGap="xl"
              controlSize={40}
              withControls={sounds.length > 3}
              emblaOptions={{
                loop: true,
                dragFree: false,
                align: "center",
              }}
              controlsOffset="lg"
              classNames={{
                control:
                  "bg-surface border-border text-text-primary hover:bg-accent hover:text-white",
              }}
            >
              {sounds.map((sound) => (
                <Carousel.Slide key={sound.id}>
                  <SoundCard sound={sound} />
                </Carousel.Slide>
              ))}
            </Carousel>
          </Box>
        ))}
      </Stack>
    </Container>
  );
}
