import { useState, useEffect } from "react";
import {
  Container,
  TextInput,
  Button,
  Stack,
  Title,
  Text,
  Paper,
  Modal,
  Group,
  Avatar,
  FileButton,
  ThemeIcon,
  Divider,
  Box,
  Center,
} from "@mantine/core";
import {
  IconUser,
  IconPhoto,
  IconSettings,
  IconCheck,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

export function ProfileSettings() {
  const { user, logout } = useAuthStore();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url || null);
      }
    }
    getProfile();
  }, [user]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (selectedFile && user) {
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        finalAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      const { error: dbError } = await supabase.from("profiles").upsert({
        id: user?.id,
        username,
        avatar_url: finalAvatarUrl,
        updated_at: new Date(),
      });

      if (dbError) throw dbError;

      notifications.show({
        title: "Profile Updated",
        message: "Your changes have been saved successfully ✨",
        color: "teal",
        icon: <IconCheck size={18} />,
        loading: false,
        autoClose: 3000,
      });

      setSelectedFile(null);
    } catch (error: any) {
      notifications.show({
        title: "Update failed",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("delete_user_account");
    if (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
      setLoading(false);
    } else {
      await supabase.auth.signOut();
      logout();
      window.location.href = "/";
    }
  };

  return (
    <Container size="xs" py={60}>
      <Paper
        withBorder
        shadow="md"
        radius="lg"
        p={0}
        style={{ overflow: "hidden" }}
      >
        <Box p="xl" className="bg-bg">
          <Group>
            <ThemeIcon
              size={44}
              radius="md"
              variant="white"
              color="var(--color-accent)"
              className="bg-surface"
            >
              <IconSettings size={26} />
            </ThemeIcon>
            <Stack gap={0}>
              <Title order={3}>Account Settings</Title>
              <Text size="xs" c="dimmed">
                {user?.email}
              </Text>
            </Stack>
          </Group>
        </Box>

        <hr className="border-white/10" />

        <Stack p="xl" gap="xl">
          <Center>
            <Stack align="center" gap="xs">
              <Avatar
                src={avatarUrl}
                size={120}
                radius={120}
                style={{
                  border: "4px solid white",
                  boxShadow: "var(--mantine-shadow-md)",
                }}
              />
              <FileButton
                onChange={handleFileChange}
                accept="image/png,image/jpeg"
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="subtle"
                    size="compact-xs"
                    leftSection={<IconPhoto size={14} />}
                  >
                    Change Photo
                  </Button>
                )}
              </FileButton>
            </Stack>
          </Center>

          <Stack gap="sm">
            <TextInput
              label="Username"
              placeholder="Your display name"
              leftSection={<IconUser size={16} />}
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              radius="md"
              className="font-sans"
            />

            <Button
              onClick={updateProfile}
              loading={loading}
              fullWidth
              radius="md"
              size="md"
              color="var(--color-accent)"
              mt="md"
              className="font-sans font-medium"
            >
              Save All Changes
            </Button>
          </Stack>

          <Divider
            label="Danger Zone"
            labelPosition="center"
            color="red"
            className="font-sans"
          />

          <Group justify="space-between">
            <Text size="xs" c="dimmed" style={{ maxWidth: "70%" }}>
              Permanently delete your account and all data.
            </Text>
            <Button
              color="red"
              variant="subtle"
              size="xs"
              onClick={() => setDeleteModalOpen(true)}
              className="font-sans font-semibold"
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
        centered
        radius="lg"
      >
        <Text size="sm" mb="xl">
          Are you sure? This action is irreversible and all your soundscapes
          will be lost.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={deleteAccount}>
            Confirm Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
