"use client";

import { useRole } from "@/hooks/useRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardLoader from "@/common/DashboardLoader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isClient, role, isSuperAdmin } = useRole();
    const router = useRouter();

    useEffect(() => {
        if (role && !isClient && !isSuperAdmin) {
            // If they are not a client or superadmin, redirect to their role dashboard
            router.push(`/${role}/dashboard`);
        }
    }, [isClient, role, router, isSuperAdmin]);

    if (!role) return <DashboardLoader />;

    return <>{children}</>;
}
