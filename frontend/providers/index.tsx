"use client";

import { AuthProvider } from "@/context/authContext";
import RoleRouteGuard from "@/components/auth/RoleRouteGuard";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoleRouteGuard>{children}</RoleRouteGuard>
    </AuthProvider>
  );
}
