"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check if token exists in localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

        // Redirect to "/login" if no token and prevent dashboard from loading directly
        if (!token && pathname && !pathname.includes("/auth")) {
            router.replace("/auth/login");
        } else {
            setIsAuthorized(true);
        }
    }, [router, pathname]);

    // During SSR or before mount, if it's an auth route, let it render the frame.
    // Otherwise, show a nice loader instead of an absolutely black screen void.
    if (!isMounted) {
        if (pathname?.includes("/auth")) {
            return <>{children}</>;
        }
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3">Loading application...</span>
            </div>
        );
    }

    if (!isAuthorized && !pathname?.includes("/auth")) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                <span className="ml-3">Authenticating...</span>
            </div>
        );
    }

    return <>{children}</>;
}
