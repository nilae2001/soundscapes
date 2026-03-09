import {
  Burger,
  Container,
  Group,
  Collapse,
  Stack,
  Box,
  Button,
  Text,
  Avatar,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ThemeToggle } from "./Toggle";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { SoundscapeSearch } from "./SearchBar";
import logo from "../assets/SoundscapeLogo.png";

export function HeaderMenu() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    close();
    window.location.reload();
    navigate("/");
  };

  const navLinks = [
    { link: "/explore", label: "Explore" },
    ...(user
      ? [
          { link: "/saved", label: "Saved Soundscapes" },
          { link: "/create", label: "Create Soundscape" },
          { link: "/my-sounds", label: "My Soundscapes" },
        ]
      : []),
  ];

  const NavigationLinks = ({ isMobile }: { isMobile: boolean }) => (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.label}
          to={link.link}
          onClick={close}
          className={`px-3 py-2 rounded-md text-sm font-sans font-medium tracking-tight transition-colors no-underline text-text-secondary hover:bg-surface hover:text-accent ${
            isMobile ? "w-full" : ""
          }`}
        >
          {link.label}
        </Link>
      ))}
      {user ? (
        <Button
          variant="subtle"
          onClick={handleLogout}
          size="sm"
          fullWidth={isMobile}
          justify={isMobile ? "flex-start" : "center"}
          className={
            isMobile
              ? "px-3 text-sm font-sans font-medium tracking-tight"
              : "text-sm font-sans font-medium tracking-tight"
          }
        >
          Logout
        </Button>
      ) : (
        <Link
          to="/login"
          onClick={close}
          className="px-3 py-2 rounded-md text-sm font-sans font-medium tracking-tight no-underline text-text-secondary hover:bg-surface hover:text-accent"
        >
          Login
        </Link>
      )}
    </>
  );

  const ActionIcons = () => (
    <Group gap="sm" wrap="nowrap">
      <SoundscapeSearch />
      {user && (
        <Avatar
          src={profile?.avatar_url}
          size={30}
          radius="xl"
          className="cursor-pointer"
          onClick={() => navigate("/profile")}
        />
      )}
    </Group>
  );

  return (
    <header className="w-full bg-bg border-b border-border sticky top-0 z-50">
      <Container size="xl">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="no-underline flex items-center gap-1">
            <Image src={logo} h={40} w="auto" alt="Logo" />
            <Text className="text-xl md:text-xl font-sans font-bold tracking-tighter leading-[1.1] text-text-primary">
              Soundscapes
            </Text>
          </Link>

          <Group gap={5} visibleFrom="md">
            <NavigationLinks isMobile={false} />
            <ActionIcons />
            <ThemeToggle />
          </Group>

          <Group hiddenFrom="md" gap={5}>
            <ThemeToggle />
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>
        </div>

        <Collapse in={opened} hiddenFrom="md">
          <Box className="pb-6 pt-2 border-t border-border">
            <Stack gap={8}>
              <NavigationLinks isMobile={true} />

              <hr className="border-border opacity-50 my-2" />

              <Group justify="space-between" px="sm">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Tools
                </Text>
                <ActionIcons />
              </Group>
            </Stack>
          </Box>
        </Collapse>
      </Container>
    </header>
  );
}
