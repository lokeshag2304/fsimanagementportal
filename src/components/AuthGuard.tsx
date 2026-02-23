"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Check if token exists in localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

        // Redirect to "/login" if no token and prevent dashboard from loading directly
        if (!token && !pathname.includes("/auth")) {
            router.push("/auth/login");
        } else {
            setIsAuthorized(true);
        }
    }, [router, pathname]);

    // Prevent loading children (dashboard UI) until authorized
    if (!isAuthorized) return null;

    return <>{children}</>;
}
