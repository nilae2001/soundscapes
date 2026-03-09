import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Center, Loader } from "@mantine/core";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
