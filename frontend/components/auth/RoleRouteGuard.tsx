"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";

export default function RoleRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { loading, isLoggedIn, user } = useAuth();

  useEffect(() => {
    // Auth state is still being checked
    if (loading) return;

    // Not logged in → no role restriction
    if (!isLoggedIn || !user) return;

    const role = user.role;
    const approvalStatus = user.approvalStatus;

    // =========================================================
    // SELLER
    // =========================================================
    if (role === "seller") {
      // Pending seller
      if (approvalStatus === "pending") {
        const allowedPath = "/signup/seller/under-review";

        if (pathname !== allowedPath) {
          router.replace(allowedPath);
        }

        return;
      }

      // Rejected seller
      if (approvalStatus === "rejected") {
        const allowedPath = "/signup/seller/rejected";

        if (pathname !== allowedPath) {
          router.replace(allowedPath);
        }

        return;
      }

      // Approved seller
      if (!pathname.startsWith("/seller")) {
        router.replace("/seller/dashboard");
      }

      return;
    }

    // =========================================================
    // DELIVERY
    // =========================================================
    if (role === "delivery") {
      // Pending delivery partner
      if (approvalStatus === "pending") {
        const allowedPath = "/signup/delivery/under-review";

        if (pathname !== allowedPath) {
          router.replace(allowedPath);
        }

        return;
      }

      // Rejected delivery partner
      if (approvalStatus === "rejected") {
        const allowedPath = "/signup/delivery/rejected";

        if (pathname !== allowedPath) {
          router.replace(allowedPath);
        }

        return;
      }

      // Approved delivery partner
      if (!pathname.startsWith("/delivery")) {
        router.replace("/delivery/dashboard");
      }

      return;
    }

    // =========================================================
    // CUSTOMER
    // =========================================================
    // Customer users are not restricted by this guard.
  }, [loading, isLoggedIn, user, pathname, router]);

  return <>{children}</>;
}
