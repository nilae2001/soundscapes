# Security Fixes - Implementation Guide

This file contains code examples to fix the critical security issues identified in SECURITY_REVIEW_FINDINGS.md.

---

## FIX #1: Move Hardcoded URLs to Environment Variables

**File:** `src/pages/CreateSoundscapePage.tsx`  
**Current Code (INSECURE):**

```typescript
const response = await fetch(
  "https://ezvmqabfyjwvnrwhsjeg.supabase.co/functions/v1/book-scout",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ userPrompt: bookQuery.trim() }),
  },
);
```

**Fixed Code:**

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BOOK_SCOUT_URL = `${SUPABASE_URL}/functions/v1/book-scout`;
const AUDIO_SCOUT_URL = `${SUPABASE_URL}/functions/v1/audio-scout`;

const response = await fetch(BOOK_SCOUT_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({ userPrompt: bookQuery.trim() }),
});
```

**File:** `.env`  
**Already configured:**

```
VITE_SUPABASE_URL=https://ezvmqabfyjwvnrwhsjeg.supabase.co
```

---

## FIX #2: Create Backend Proxy for Pexels API

**Recommended Option:** Move to Supabase Edge Functions or separate API layer

**For now, create a wrapper function:**

**File:** `src/lib/pexels.ts` (Updated)

```typescript
import { supabase } from "./supabase";

// Don't expose API key to client - call through backend instead
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PEXELS_PROXY_URL = `${SUPABASE_URL}/functions/v1/pexels-proxy`;

export const pexels = {
  photos: {
    search: async (params: Record<string, string | number>) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const query = new URLSearchParams(
          params as Record<string, string>,
        ).toString();
        const response = await fetch(`${PEXELS_PROXY_URL}/search?${query}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Pexels search failed");
        throw error;
      }
    },

    curated: async (params: Record<string, string | number> = {}) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const query = new URLSearchParams(
          params as Record<string, string>,
        ).toString();
        const response = await fetch(`${PEXELS_PROXY_URL}/curated?${query}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Pexels curated fetch failed");
        throw error;
      }
    },

    show: async (id: number) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch(`${PEXELS_PROXY_URL}/show/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Pexels photo fetch failed");
        throw error;
      }
    },
  },

  videos: {
    search: async (params: Record<string, string | number>) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const query = new URLSearchParams(
          params as Record<string, string>,
        ).toString();
        const response = await fetch(
          `${PEXELS_PROXY_URL}/videos/search?${query}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Pexels API error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error("Pexels video search failed");
        throw error;
      }
    },
  },
};
```

**Supabase Edge Function (Backend - `supabase/functions/pexels-proxy/index.ts`):**

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const pexelsKey = Deno.env.get("PEXELS_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

const PEXELS_BASE = "https://api.pexels.com/v1";

async function verifyAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid token");
  }

  return user;
}

serve(async (req: Request) => {
  try {
    // Verify user is authenticated
    const user = await verifyAuth(req);

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/pexels-proxy", "");

    if (path.includes("/search")) {
      const params = new URLSearchParams(url.search);
      const pexelsUrl = `${PEXELS_BASE}/search?${params.toString()}`;

      const response = await fetch(pexelsUrl, {
        headers: {
          Authorization: pexelsKey || "",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: response.status,
      });
    }

    if (path.includes("/curated")) {
      const params = new URLSearchParams(url.search);
      const pexelsUrl = `${PEXELS_BASE}/curated?${params.toString()}`;

      const response = await fetch(pexelsUrl, {
        headers: {
          Authorization: pexelsKey || "",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: response.status,
      });
    }

    if (path.includes("/show/")) {
      const id = path.split("/").pop();
      const pexelsUrl = `${PEXELS_BASE}/photos/${id}`;

      const response = await fetch(pexelsUrl, {
        headers: {
          Authorization: pexelsKey || "",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
        status: response.status,
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
```

---

## FIX #3: Add Input Validation to Auth Form

**File:** `src/components/Auth.tsx` (Updated)

First, update `.env`:

```
VITE_APP_URL=https://nilaerturk.com
```

**Updated Component:**

```typescript
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

// Define validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
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
    mode: "onBlur",
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
        // Generic error message - don't expose details
        notifications.show({
          title: "Error",
          message:
            type === "login"
              ? "Invalid email or password"
              : "Account creation failed. Email may already be in use.",
          color: "red",
          autoClose: 5000,
        });
      } else {
        if (type === "register") {
          notifications.show({
            title: "Registration Successful!",
            message: "Check your email for confirmation link.",
            color: "var(--color-accent)",
            position: "bottom-right",
            autoClose: 5000,
          });
        } else {
          navigate("/explore");
        }
      }
    } catch (err) {
      // Catch unexpected errors
      console.error("Auth error (dev only)");
      notifications.show({
        title: "Error",
        message: "Something went wrong. Please try again.",
        color: "red",
        autoClose: 5000,
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

        <form onSubmit={form.onSubmit(handleAuth)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="hello@example.com"
              required
              {...form.getInputProps("email")}
              size="md"
              type="email"
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps("password")}
              size="md"
              description={
                type === "register"
                  ? "Min 8 chars, uppercase, lowercase, number"
                  : undefined
              }
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading || !form.isValid()}
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
              form.reset();
              setType(type === "login" ? "register" : "login");
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
```

---

## FIX #4: Remove Raw Error Logging

**File:** `src/components/FeaturedSounds.tsx`

**Before:**

```typescript
if (error) {
  console.error("Error fetching featured sounds:", error);
  return;
}
```

**After:**

```typescript
if (error) {
  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error fetching featured sounds:", error);
  }
  // Silently fail and show skeleton state
  return;
}
```

**File:** `src/pages/CreateSoundscapePage.tsx` (Lines 74, 186, 206)

**Before:**

```typescript
console.error("Playback failed", e);
console.error("Book Scout failed:", err);
console.error("Pexels fetch failed: " + error);
```

**After:**

```typescript
if (process.env.NODE_ENV === "development") {
  console.error("Playback failed:", e);
}
// Silently handle error

if (process.env.NODE_ENV === "development") {
  console.error("Book Scout failed:", err);
}
setIsBookSearching(false);

if (process.env.NODE_ENV === "development") {
  console.error("Pexels fetch failed:", error);
}
```

---

## FIX #5: Add Rate Limiting Helper

**File:** `src/lib/rateLimiter.ts` (New File)

```typescript
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindowMs: number;

  constructor(maxRequests: number = 10, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.timeWindowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => time > windowStart);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRemainingTime(): number {
    if (this.requests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...this.requests);
    const remainingTime = oldestRequest + this.timeWindowMs - Date.now();

    return Math.max(0, remainingTime);
  }
}

// Create singleton instances for different API calls
export const searchRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 requests per 5 minutes
```

**File:** `src/pages/CreateSoundscapePage.tsx` (Updated useEffect for book search)

```typescript
import { searchRateLimiter } from "../lib/rateLimiter";

useEffect(() => {
  if (!bookQuery.trim() || bookQuery.length < 3) {
    setFoundBooks([]);
    return;
  }

  const delayDebounceFn = setTimeout(async () => {
    setIsBookSearching(true);
    try {
      // Check rate limit
      if (!searchRateLimiter.isAllowed()) {
        const wait = searchRateLimiter.getRemainingTime();
        notifications.show({
          title: "Rate Limited",
          message: `Please wait ${Math.ceil(wait / 1000)}s before searching again`,
          color: "yellow",
          autoClose: 3000,
        });
        setIsBookSearching(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/book-scout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userPrompt: bookQuery.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setFoundBooks(data.suggestions);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Book Scout failed:", err);
      }
    } finally {
      setIsBookSearching(false);
    }
  }, 800);

  return () => clearTimeout(delayDebounceFn);
}, [bookQuery]);
```

---

## FIX #6: Add Authorization Check in Edit Form

**File:** `src/pages/CreateSoundscapePage.tsx`

```typescript
useEffect(() => {
  if (isEditMode && id) {
    async function loadExistingData() {
      const { data: soundscape } = await supabase
        .from("soundscapes")
        .select("*")
        .eq("id", id)
        .single();

      // ✅ ADD THIS CHECK:
      if (soundscape && soundscape.user_id !== user?.id) {
        navigate("/explore");
        notifications.show({
          title: "Unauthorized",
          message: "You don't have permission to edit this soundscape.",
          color: "red",
          autoClose: 4000,
        });
        return;
      }

      if (soundscape) {
        form.setValues({
          title: soundscape.title,
          category: soundscape.category,
          description: soundscape.description || "",
          is_public: soundscape.is_public ?? false,
        });

        setPhotoSelected({
          id: 0,
          src: {
            original: soundscape.image_url,
            medium: soundscape.image_url,
          },
        } as any);
      }

      // ... rest of code
    }
    loadExistingData();
  }
}, [id, isEditMode, user?.id]);
```

---

## FIX #7: Update Profile Settings Error Handling

**File:** `src/pages/ProfileSettings.tsx`

```typescript
const deleteAccount = async () => {
  setLoading(true);
  try {
    const { error } = await supabase.rpc("delete_user_account");
    if (error) throw error;

    await supabase.auth.signOut();
    logout();
    window.location.href = "/";
  } catch (error) {
    // Don't expose raw error message
    if (process.env.NODE_ENV === "development") {
      console.error("Delete account error:", error);
    }

    notifications.show({
      title: "Error",
      message: "Failed to delete account. Please contact support.",
      color: "red",
      autoClose: 5000,
    });
  } finally {
    setLoading(false);
  }
};
```

---

## Updated .env Template

**File:** `.env`

```env
# Supabase Configuration (Public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...

# Application Configuration
VITE_APP_URL=https://yourdomain.com

# Note: The following API keys should NOT be in .env anymore:
# - VITE_PEXELS_API_KEY (use backend proxy instead)
# - VITE_BOOKS_API_KEY (use backend RPC function instead)
```

---

## Testing Checklist

After implementing fixes:

- [ ] Test login/register with invalid email format
- [ ] Test register with weak passwords
- [ ] Test network requests in DevTools - no API keys visible
- [ ] Test rate limiting on search endpoints
- [ ] Test edit form redirection if accessing another user's soundscape
- [ ] Check that console errors don't show in production build
- [ ] Verify Git history doesn't contain API keys
- [ ] Test error notifications display generic messages

---

## Deployment Checklist

Before pushing to production:

1. **Secrets Management:**
   - [ ] Remove `.env` from Git history (use git-filter-branch)
   - [ ] Set environment variables in deployment platform (Vercel, Netlify, etc.)
   - [ ] Verify `.env` is in `.gitignore`
   - [ ] Rotate any compromised API keys

2. **Code Security:**
   - [ ] Remove all console.error/log statements (or make development-only)
   - [ ] Implement proper error logging service (Sentry, LogRocket, etc.)
   - [ ] Enable Content Security Policy headers

3. **API Security:**
   - [ ] Verify all third-party API calls go through backend proxies
   - [ ] Test rate limiting under load
   - [ ] Verify HTTPS enforcement
   - [ ] Test CORS configuration

4. **Database Security:**
   - [ ] Audit and enable RLS on all tables
   - [ ] Verify user can only access their own data
   - [ ] Test that admin queries use service role key (backend only)

---

**Last Updated:** March 9, 2026  
**Status:** Recommended implementations ready for deployment
