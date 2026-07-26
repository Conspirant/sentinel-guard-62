import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: Layout,
});

function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}
