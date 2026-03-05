"use client";

import { useRole } from "@/hooks/useRole";
import React from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    excludeRoles?: string[];
    fallback?: React.ReactNode;
}

export function RoleGuard({
    children,
    allowedRoles,
    excludeRoles,
    fallback = null
}: RoleGuardProps) {
    const { role } = useRole();

    if (!role) return null;

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <>{fallback}</>;
    }

    if (excludeRoles && excludeRoles.includes(role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export function ClientOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
    return <RoleGuard allowedRoles={["ClientAdmin"]} fallback={fallback}>{children}</RoleGuard>;
}

export function AdminOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
    return <RoleGuard allowedRoles={["SuperAdmin", "UserAdmin"]} fallback={fallback}>{children}</RoleGuard>;
}
