import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { HeaderMenu } from "./components/HeaderMenu";
import { Home } from "./pages/Home";
import { SoundscapePage } from "./pages/SoundscapePage";
import { ExplorePage } from "./pages/Explore";
import AuthPage from "./components/Auth";
import ScrollToTop from "./components/ScrollToTop";
import { SavedSoundsPage } from "./pages/SavedSounds";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./store/useAuthStore";
import { ProtectedRoute } from "./components/ProtectedRoute";
import CreateSoundscapePage from "./pages/CreateSoundscapePage";
import { MySoundsPage } from "./pages/MySounds";
import { ProfileSettings } from "./pages/ProfileSettings";
import { ModalsProvider } from "@mantine/modals";
import { ProfilePage } from "./pages/ProfilePage";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import { Footer } from "./components/Footer";

export default function App() {
  const { setUser, setSavedIds, setProfile } = useAuthStore();

  const fetchProfileAndData = async (userId: string) => {
    const [profileRes, savedRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single(),
      supabase
        .from("saved_sounds")
        .select("soundscape_id")
        .eq("user_id", userId),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
    }

    if (savedRes.data) {
      setSavedIds(savedRes.data.map((s) => s.soundscape_id));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) fetchProfileAndData(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        fetchProfileAndData(user.id);
      } else {
        setProfile(null);
        setSavedIds([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications zIndex={1000} />
      <BrowserRouter basename="/soundscapes/">
        <ScrollToTop />
        <HeaderMenu />
        <ModalsProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sound/:id" element={<SoundscapePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedSoundsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateSoundscapePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <CreateSoundscapePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-sounds"
              element={
                <ProtectedRoute>
                  <MySoundsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
        </ModalsProvider>
      </BrowserRouter>
    </MantineProvider>
  );
}
