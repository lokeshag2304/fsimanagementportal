import { roleNavigationMap } from "./navigation"


export const getNavigationByRole = (role?: string) => {
  if (!role) return []

  return roleNavigationMap[role as keyof typeof roleNavigationMap] || []
}
