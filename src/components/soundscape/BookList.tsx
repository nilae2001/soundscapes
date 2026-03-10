import { Stack, Box, Group, Text, Title, Image } from "@mantine/core";
import type { Book } from "../../types/Book";

interface Props {
  books: Book[];
}

export function BookList({ books }: Props) {
  return (
    <div>
      <div className="mb-8">
        <Text className="text-accent font-bold tracking-widest uppercase text-xs">
          Reading List
        </Text>
        <Title order={2} className="tracking-tight text-3xl">
          Books with this vibe
        </Title>
      </div>

      {books.length > 0 ? (
        <Stack gap="md">
          {books.map((book) => (
            <Box
              key={book.id}
              component="a"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-surface/30 rounded-2xl border border-border transition-all duration-300 hover:bg-surface/50 hover:border-accent/50 hover:-translate-y-1 hover:shadow-xl block no-underline"
            >
              <Group wrap="nowrap" align="center">
                <Image
                  src={book.thumbnail}
                  w={70}
                  h={100}
                  fit="cover"
                  radius="md"
                  className="transition-transform duration-500 group-hover:scale-110"
                  fallbackSrc="https://placehold.co/70x100?text=No+Cover"
                />
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text
                    fw={700}
                    size="lg"
                    className="text-text-primary line-clamp-1 group-hover:text-accent transition-colors"
                  >
                    {book.title}
                  </Text>
                  <Text size="sm" className="text-text-secondary italic">
                    by{" "}
                    {Array.isArray(book.authors)
                      ? book.authors.join(", ")
                      : book.authors || "Unknown Author"}
                  </Text>
                </Stack>
              </Group>
            </Box>
          ))}
        </Stack>
      ) : (
        <Box className="h-40 rounded-3xl border-2 border-dashed border-border flex items-center justify-center italic text-text-secondary">
          No books added to this vibe yet.
        </Box>
      )}
    </div>
  );
}
