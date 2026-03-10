import {
  Container,
  Group,
  Stack,
  Title,
  Text,
  ActionIcon,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconStar,
  IconStarFilled,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  id: string;
  soundscape: any;
  isPlaying: boolean;
  isSaved: boolean;
  isOwner: boolean;
  onTogglePlay: () => void;
  onToggleSave: () => void;
  onDelete: () => void;
}

export function SoundscapeHero({
  id,
  soundscape,
  isPlaying,
  isSaved,
  isOwner,
  onTogglePlay,
  onToggleSave,
  onDelete,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative w-full" style={{ minHeight: "30vh" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${soundscape?.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(to top, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 50%, transparent) 50%, transparent 100%)",
        }}
      />

      <Container
        size="md"
        className="relative w-full pb-6"
        style={{ paddingTop: "30vh", zIndex: 2 }}
      >
        <Group
          justify="space-between"
          align="flex-end"
          wrap="nowrap"
          className="gap-8"
        >
          <Stack
            gap={2}
            className="flex-1 min-w-0 bg-bg/20 backdrop-blur-sm rounded-md px-5"
          >
            <Title className="text-3xl md:text-6xl font-bold tracking-tighter text-text-primary wrap-break-word overflow-hidden p-2">
              {soundscape?.title}
            </Title>

            <Group gap="sm" className="pt-4">
              <Text className="text-accent font-medium mt-2">created by</Text>
              <Text
                size="sm"
                className="text-accent font-medium mt-2 hover:underline cursor-pointer"
                component={Link}
                to={`/profile/${soundscape?.profiles?.username}`}
              >
                @{soundscape?.profiles?.username || "anonymous"}
              </Text>
              {isOwner && (
                <>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size={24}
                    onClick={() => navigate(`/edit/${id}`)}
                    title="Edit"
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size={24}
                    onClick={onDelete}
                    title="Delete"
                  >
                    <IconTrash size={24} />
                  </ActionIcon>
                </>
              )}
            </Group>

            {!isOwner && (
              <ActionIcon
                variant="subtle"
                color={isSaved ? "yellow" : "gray"}
                size="xl"
                onClick={onToggleSave}
                className="mt-4 hover:scale-110 transition-transform"
              >
                {isSaved ? (
                  <IconStarFilled size={40} />
                ) : (
                  <IconStar size={40} />
                )}
              </ActionIcon>
            )}

            <Text className="text-xl text-text-secondary max-w-xl pt-5 pb-2">
              {soundscape?.description}
            </Text>
          </Stack>

          <ActionIcon
            size="100px"
            radius="100%"
            variant="filled"
            className="bg-accent hover:scale-105 transition-transform shadow-md shadow-accent/40"
            onClick={onTogglePlay}
          >
            {isPlaying ? (
              <IconPlayerPause size={50} />
            ) : (
              <IconPlayerPlay size={50} />
            )}
          </ActionIcon>
        </Group>
      </Container>
    </div>
  );
}
