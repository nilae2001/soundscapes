import { Container, Group, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import logo from "../assets/SoundscapeLogo.png";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-bg py-8 mt-auto">
      <Container size="xl">
        <Group justify="space-between" align="center" mb="md">
          <Link to="/" className="no-underline flex items-center gap-1">
            <img src={logo} style={{ height: 28, width: "auto" }} alt="Logo" />
            <Text className="text-sm font-sans font-bold tracking-tighter text-text-primary">
              Soundscapes
            </Text>
          </Link>

          <Group gap="xl" visibleFrom="sm">
            <Link
              to="/explore"
              className="text-xs text-text-secondary hover:text-accent no-underline transition-colors font-sans"
            >
              Explore
            </Link>
            <Link
              to="/create"
              className="text-xs text-text-secondary hover:text-accent no-underline transition-colors font-sans"
            >
              Create
            </Link>
            <Link
              to="/saved"
              className="text-xs text-text-secondary hover:text-accent no-underline transition-colors font-sans"
            >
              Saved
            </Link>
          </Group>
        </Group>

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            made with ❤️, bad posture, and{" "}
            <a
              href="https://open.spotify.com/artist/67lytN32YpUxiSeWlKfHJ3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              yung lean
            </a>{" "}
            by{" "}
            <a
              href="https://nilaerturk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              nila
            </a>
          </Text>

          <Group gap="md">
            <Text size="xs" c="dimmed">
              Something broken?{" "}
              <a
                href="mailto:nilaerturk@gmail.com"
                className="text-accent hover:underline"
              >
                Let me know
              </a>
            </Text>
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} Soundscapes
            </Text>
          </Group>
        </Group>
      </Container>
    </footer>
  );
}
