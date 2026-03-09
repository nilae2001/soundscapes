import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Anchor,
  Center,
  Box,
} from "@mantine/core";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

export default function AuthPage() {
  const [type, setType] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } =
      type === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      notifications.show({
        title: "Error",
        message: "Login Failed",
        color: "red",
      });
    } else {
      if (type === "register") {
        notifications.show({
          title: "Registration Successful!",
          message: "Check your email for confirmation link.",
          color: "var(--color-accent)",
          position: "bottom-right",
        });
      } else {
        navigate("/explore");
      }
    }
    setLoading(false);
  };

  return (
    <Container size={420} my={80}>
      <Paper
        withBorder
        shadow="xl"
        p={40}
        radius="lg"
        className="bg-surface/50 backdrop-blur-md border-border"
      >
        <Box mb={30}>
          <Title ta="center" className="tracking-tighter text-3xl font-bold">
            {type === "login" ? "Welcome Back" : "Create Account"}
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            {type === "login"
              ? "Login to access your saved soundscapes"
              : "Join untitled to start saving your custom mixes"}
          </Text>
        </Box>

        <form onSubmit={handleAuth}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="hello@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="md"
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="md"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="md"
              className="bg-accent hover:bg-accent-dark transition-colors"
            >
              {type === "login" ? "Sign In" : "Register"}
            </Button>
          </Stack>
        </form>

        <Center mt="xl">
          <Anchor
            component="button"
            type="button"
            c="dimmed"
            onClick={() => setType(type === "login" ? "register" : "login")}
            size="sm"
          >
            {type === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </Anchor>
        </Center>
      </Paper>
    </Container>
  );
}
