import {
  TextInput,
  Stack,
  Text,
  Box,
  Group,
  Button,
  Image,
  Loader,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { notifications } from "@mantine/notifications";

interface BookSearchProps {
  selectedBooks: any[];
  onBookSelected: (book: any) => void;
  onBookRemoved: (bookId: string) => void;
}

export function BookSearch({
  selectedBooks,
  onBookSelected,
  onBookRemoved,
}: BookSearchProps) {
  const [bookQuery, setBookQuery] = useState("");
  const [foundBooks, setFoundBooks] = useState<any[]>([]);
  const [isBookSearching, setIsBookSearching] = useState(false);

  useEffect(() => {
    let active = true;
    if (!bookQuery.trim() || bookQuery.length < 3) {
      setFoundBooks([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsBookSearching(true);
      const BOOK_SCOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-scout`;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = await fetch(BOOK_SCOUT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userPrompt: bookQuery.trim() }),
        });

        if (!active) return;
        if (response.ok) {
          const data = await response.json();
          setFoundBooks(data.suggestions || []);
        } else {
          setFoundBooks([]);
          if (response.status === 429) {
            notifications.show({
              title: "Rate Limited",
              message: "Too many requests. Try again in a moment.",
              color: "orange",
            });
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Book Scout fetch error:", err);
        if (active) setFoundBooks([]);
      } finally {
        if (active) setIsBookSearching(false);
      }
    }, 800);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [bookQuery]);

  const handleSelect = (book: any) => {
    if (selectedBooks.some((b) => b.id === book.id)) return;
    onBookSelected(book);
    setBookQuery("");
    setFoundBooks([]);
  };

  return (
    <Stack gap="xs">
      <TextInput
        label="Add Books"
        placeholder="Search books..."
        value={bookQuery}
        onChange={(e) => setBookQuery(e.currentTarget.value)}
        rightSection={isBookSearching && <Loader size="xs" />}
        className="font-sans"
      />

      {foundBooks.map((book) => (
        <Box
          key={book.id}
          p="md"
          className="border border-white/10 bg-white/5 rounded-md"
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm">
              <Image src={book.thumbnail} w={30} h={45} />
              <Text size="sm" fw={600} lineClamp={1}>
                {book.title}
                {book.authors?.length > 0
                  ? ` by ${book.authors.join(", ")}`
                  : ""}
              </Text>
            </Group>
            <Button
              type="button"
              variant="light"
              color="var(--color-accent)"
              size="compact-xs"
              onClick={() => handleSelect(book)}
            >
              Add +
            </Button>
          </Group>
        </Box>
      ))}

      {selectedBooks.length > 0 && (
        <Stack gap="xs" mt="md">
          <Text size="xs" fw={700} tt="uppercase">
            Your Books
          </Text>
          {selectedBooks.map((book) => (
            <Group
              key={book.id}
              justify="space-between"
              p="xs"
              className="bg-white/5 rounded-md border border-white/10"
            >
              <Group gap="sm">
                <Image src={book.thumbnail} w={20} h={30} />
                <Text size="sm">
                  {book.title}
                  {book.authors?.length > 0
                    ? ` by ${book.authors.join(", ")}`
                    : ""}
                </Text>
              </Group>
              <IconX
                size={16}
                className="cursor-pointer text-red-400"
                onClick={() => onBookRemoved(book.id)}
              />
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
