import { useParams } from "react-router-dom";
import { Container, Grid, Box } from "@mantine/core";
import { useSoundscape } from "../hooks/useSoundscape";
import { SoundscapeHero } from "../components/soundscape/SoundscapeHero";
import { Mixer } from "../components/soundscape/Mixer";
import { BookList } from "../components/soundscape/BookList";

export function SoundscapePage() {
  const { id } = useParams();
  const {
    soundscape,
    tracks,
    books,
    isPlaying,
    isSaved,
    isOwner,
    toggleMasterPlay,
    handleVolumeChange,
    toggleSave,
    handleDelete,
  } = useSoundscape(id);

  return (
    <Box>
      <SoundscapeHero
        id={id!}
        soundscape={soundscape}
        isPlaying={isPlaying}
        isSaved={isSaved}
        isOwner={isOwner}
        onTogglePlay={toggleMasterPlay}
        onToggleSave={toggleSave}
        onDelete={handleDelete}
      />
      <Container size="md" py={80}>
        <Grid gutter={60} align="flex-start">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Mixer tracks={tracks} onVolumeChange={handleVolumeChange} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <BookList books={books} />
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
