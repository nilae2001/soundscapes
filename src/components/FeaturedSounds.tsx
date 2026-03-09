import { Carousel } from "@mantine/carousel";
import { Text, Title, Container, Box, Skeleton } from "@mantine/core";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Soundscape } from "../types/Soundscape";
import { SoundCard } from "./SoundCard";

export function FeaturedSounds() {
  const autoplay = useRef(Autoplay({ delay: 5000 }));
  const [sounds, setSounds] = useState<Soundscape[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSounds() {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("soundscapes")
        .select("*")
        .order("created_at", { ascending: false });

      if (user) {
        query = query.or(
          `user_id.is.null,is_public.eq.true,user_id.eq.${user.id}`,
        );
      } else {
        query = query.or(`user_id.is.null,is_public.eq.true`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching featured sounds:", error);
        return;
      }

      if (data) setSounds(data);

      setIsLoading(false);
    }
    fetchSounds();
  }, []);

  if (isLoading) {
    return (
      <Box className="bg-bg py-20 border-t border-border">
        <Container size="md">
          <div className="mb-12">
            <Skeleton height={12} width={160} mb={12} radius="md" />
            <Skeleton height={36} width={280} radius="md" />
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                height={220}
                style={{ flex: "0 0 33%" }}
                radius="xl"
              />
            ))}
          </div>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="bg-bg py-20 border-t border-border">
      <Container size="md">
        <div className="mb-12">
          <Text className="text-accent font-bold tracking-widest uppercase text-xs mb-2">
            Curated Environments
          </Text>
          <Title className="text-text-primary text-4xl font-sans tracking-tighter">
            Featured Soundscapes
          </Title>
        </div>

        <Carousel
          slideSize={{ base: "100%", sm: "50%", md: "33.333333%" }}
          slideGap="md"
          withControls={sounds.length > 3}
          controlSize={40}
          emblaOptions={{
            loop: true,
            dragFree: false,
            align: "center",
          }}
          plugins={[autoplay.current]}
          onMouseEnter={autoplay.current.stop}
          onMouseLeave={() => autoplay.current.play()}
          classNames={{
            control:
              "bg-surface border-border text-text-primary hover:bg-accent hover:text-white transition-colors",
            indicator: "bg-accent",
          }}
        >
          {sounds.map((item) => (
            <Carousel.Slide key={item.id}>
              <SoundCard sound={item} />
            </Carousel.Slide>
          ))}
        </Carousel>
      </Container>
    </Box>
  );
}
