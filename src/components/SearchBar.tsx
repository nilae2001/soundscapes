import { useState } from "react";
import {
  Autocomplete,
  Loader,
  ActionIcon,
  Group,
  Transition,
  Box,
  Text,
  Avatar,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { IconSearch, IconX } from "@tabler/icons-react";

export function SoundscapeSearch() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    { value: string; id: string; image: string; type: "sound" | "user" }[]
  >([]);
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  const handleChange = async (val: string) => {
    setQuery(val);
    if (val.trim().length === 0) {
      setData([]);
      return;
    }

    setLoading(true);

    const soundSearch = supabase
      .from("soundscapes")
      .select("id, title, image_url")
      .ilike("title", `%${val}%`)
      .eq("is_public", true)
      .limit(5);

    const profileSearch = supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${val}%`)
      .limit(3);

    const [resSounds, resProfiles] = await Promise.all([
      soundSearch,
      profileSearch,
    ]);

    const formattedResults: any[] = [];

    if (resProfiles.data) {
      resProfiles.data.forEach((p) => {
        formattedResults.push({
          value: p.username,
          id: p.username,
          image: p.avatar_url,
          type: "user",
        });
      });
    }

    if (resSounds.data) {
      resSounds.data.forEach((s) => {
        formattedResults.push({
          value: s.title,
          id: s.id,
          image: s.image_url,
          type: "sound",
        });
      });
    }

    setData(formattedResults);
    setLoading(false);
  };

  const handleSelect = (val: string) => {
    const selected = data.find((d) => d.value === val);
    if (selected) {
      if (selected.type === "user") {
        navigate(`/profile/${selected.id}`);
      } else {
        navigate(`/sound/${selected.id}`);
      }
      setOpened(false);
      setQuery("");
    }
  };

  return (
    <Group gap="xs" wrap="nowrap">
      <Transition
        mounted={opened}
        transition="slide-left"
        duration={400}
        timingFunction="ease"
      >
        {(styles) => (
          <Box style={{ ...styles, overflow: "hidden" }}>
            <Autocomplete
              placeholder="Search vibes..."
              data={data}
              value={query}
              onChange={handleChange}
              filter={({ options }) => options}
              rightSection={loading ? <Loader size="1rem" /> : null}
              renderOption={({ option }) => {
                const item = data.find((d) => d.value === option.value);
                return (
                  <Group gap="sm" wrap="nowrap">
                    <Avatar
                      src={item?.image}
                      size="sm"
                      radius={item?.type === "user" ? "xl" : "sm"}
                    />
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {option.value}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item?.type === "user" ? "User Profile" : "Soundscape"}
                      </Text>
                    </div>
                  </Group>
                );
              }}
              onOptionSubmit={handleSelect}
              variant="filled"
              radius="xl"
              w={{ base: 200, md: 300 }}
              autoFocus
            />
          </Box>
        )}
      </Transition>

      <ActionIcon
        variant="subtle"
        color="gray"
        radius="xl"
        size="lg"
        onClick={() => setOpened(!opened)}
        className="transition-transform active:scale-95"
      >
        {opened ? <IconX size={22} /> : <IconSearch size={22} />}
      </ActionIcon>
    </Group>
  );
}
