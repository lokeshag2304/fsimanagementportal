"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useRole() {
    const { user } = useAuth();

    const isClient = user?.role === "ClientAdmin" || user?.login_type === 3;
    const isSuperAdmin = user?.role === "SuperAdmin" || user?.login_type === 1;
    const isUserAdmin = user?.role === "UserAdmin" || user?.login_type === 2;

    return {
        role: user?.role,
        user,
        isClient,
        isSuperAdmin,
        isUserAdmin,
    };
}
