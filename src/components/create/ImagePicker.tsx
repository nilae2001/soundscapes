import {
  TextInput,
  ScrollArea,
  Image,
  Stack,
  Text,
  Button,
  Grid,
  Skeleton,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { pexels } from "../../lib/pexels";
import type { PexelsPhoto, PexelsPhotoResults } from "../../types/Pexels";

interface ImagePickerProps {
  photoSelected: PexelsPhoto | undefined;
  onSelect: (photo: PexelsPhoto) => void;
  onClear: () => void;
}

export function ImagePicker({
  photoSelected,
  onSelect,
  onClear,
}: ImagePickerProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PexelsPhotoResults | undefined>();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [photoSelected]);

  useEffect(() => {
    let active = true;
    async function loadPhotos() {
      if (!query.trim()) {
        setPhotos(undefined);
        return;
      }
      try {
        const response = await pexels.photos.search(query);
        if (active) setPhotos(response);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Pexels fetch failed:", error);
      }
    }
    loadPhotos();
    return () => {
      active = false;
    };
  }, [query]);

  if (photoSelected) {
    return (
      <Stack>
        <Text fw={600}>Selected Image</Text>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <div className="relative mb-2">
              {!imageLoaded && <Skeleton height={200} radius="md" />}
              <Image
                src={photoSelected.src.original}
                radius="md"
                className="cursor-pointer"
                style={{ display: imageLoaded ? "block" : "none" }}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            <Button
              type="button"
              className="bg-accent font-sans font-medium"
              onClick={onClear}
            >
              Choose a different photo
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack>
      <TextInput
        label="Search Cover Image"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Pexels..."
        className="font-sans"
      />
      {photos && "photos" in photos && (
        <ScrollArea h={400} scrollbars="y">
          <div style={{ columnCount: 3, columnGap: "1rem" }}>
            {photos.photos.map((photo: PexelsPhoto) => (
              <div
                key={photo.id}
                style={{ marginBottom: "1rem", breakInside: "avoid" }}
              >
                <Image
                  src={photo.src.medium}
                  radius="md"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => onSelect(photo)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Stack>
  );
}
