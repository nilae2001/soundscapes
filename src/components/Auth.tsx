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
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/\d/, "Password must contain a number"),
});

export default function AuthPage() {
  const [type, setType] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const schema = type === "login" ? loginSchema : registerSchema;

  const form = useForm({
    mode: "uncontrolled",
    validate: zodResolver(schema),
    initialValues: {
      email: "",
      password: "",
    },
  });

  const handleAuth = async (values: typeof form.values) => {
    setLoading(true);

    try {
      const { error } =
        type === "login"
          ? await supabase.auth.signInWithPassword({
              email: values.email,
              password: values.password,
            })
          : await supabase.auth.signUp({
              email: values.email,
              password: values.password,
              options: {
                emailRedirectTo: `${import.meta.env.VITE_APP_URL}/soundscapes/`,
              },
            });

      if (error) {
        notifications.show({
          title: "Error",
          message:
            type === "login"
              ? "Invalid email or password"
              : "Registration failed",
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
    } catch (err) {
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
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

        <form onSubmit={form.onSubmit((values) => handleAuth(values))}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              {...form.getInputProps("email")}
              error={form.errors.email}
              size="md"
            />

            <PasswordInput
              label="Password"
              placeholder={
                type === "register"
                  ? "Min. 8 chars (letter, number, uppercase)"
                  : "Your password"
              }
              {...form.getInputProps("password")}
              error={form.errors.password}
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
            onClick={() => {
              setType(type === "login" ? "register" : "login");
              form.reset();
            }}
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
