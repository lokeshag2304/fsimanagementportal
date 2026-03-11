import {
  Home,
  BookOpen,
  Rocket,
  Users,
  Book,
  UserPlus,
  UserCog,
  Package,
  Globe,
  X,
} from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon?: any
  hasDropdown?: boolean
  hasSubmenu?: boolean
  submenu?: { name: string; href: string }[]
}

type Role = "SuperAdmin" | "ClientAdmin" | "UserAdmin"

export const roleNavigationMap: Record<Role, NavItem[]> = {
  SuperAdmin: [
    { name: "Dashboard", href: "/SuperAdmin/dashboard", icon: Home },
    { name: "Subscription", href: "/SuperAdmin/subscription", icon: UserPlus },
    { name: "SSL", href: "/SuperAdmin/ssl", icon: Book },
    { name: "Counter", href: "/SuperAdmin/counter", icon: BookOpen },
    { name: "Domains", href: "/SuperAdmin/domains", icon: Globe },
    { name: "Emails", href: "/SuperAdmin/sub-email", icon: Rocket },
    { name: "Hosting", href: "/SuperAdmin/hosting", icon: Rocket },
    {
      name: "User Management",
      href: "/SuperAdmin/user-management",
      icon: UserCog,
      hasDropdown: true,
      hasSubmenu: true,
      submenu: [
        { name: "Super Admin", href: "/SuperAdmin/superadmins" },
        { name: "Client", href: "/SuperAdmin/clients" },
        { name: "User Admin", href: "/SuperAdmin/users" },
      ],
    },
    {
      name: "Tool",
      href: "/SuperAdmin/user-management",
      icon: UserCog,
      hasDropdown: true,
      hasSubmenu: true,
      submenu: [
        { name: "Products", href: "/SuperAdmin/products" },
        { name: "Domain", href: "/SuperAdmin/domain" },
        { name: "Vendors", href: "/SuperAdmin/vendors" },
      ],
    },
    { name: "Activity", href: "/SuperAdmin/activity", icon: Rocket },
  ],


  ClientAdmin: [
    { name: "Dashboard", href: "/client/dashboard", icon: Home },
    { name: "SSL", href: "/client/ssl", icon: Book },
    { name: "Domains", href: "/client/domains", icon: Globe },
    { name: "Emails", href: "/client/sub-email", icon: Rocket },
    { name: "Hosting", href: "/client/hosting", icon: Rocket },
    { name: "Activity", href: "/client/activity", icon: Rocket },
  ],


  UserAdmin: [
    { name: "Dashboard", href: "/UserAdmin/dashboard", icon: Home },
    { name: "Subscription", href: "/UserAdmin/subscription", icon: UserPlus },
    { name: "SSL", href: "/UserAdmin/ssl", icon: Book },
    { name: "Counter", href: "/UserAdmin/counter", icon: BookOpen },
    { name: "Domains", href: "/UserAdmin/domains", icon: Globe },
    { name: "Emails", href: "/UserAdmin/sub-email", icon: Rocket },
    { name: "Hosting", href: "/UserAdmin/hosting", icon: Rocket },
    {
      name: "User Management",
      href: "/UserAdmin/user-management",
      icon: UserCog,
      hasDropdown: true,
      hasSubmenu: true,
      submenu: [
        { name: "Client", href: "/UserAdmin/clients" },
        { name: "User Admin", href: "/UserAdmin/users" },
      ],
    },
    {
      name: "Tool",
      href: "/UserAdmin/user-management",
      icon: UserCog,
      hasDropdown: true,
      hasSubmenu: true,
      submenu: [
        { name: "Products", href: "/UserAdmin/products" },
        { name: "Domain", href: "/UserAdmin/domain" },
        { name: "Vendors", href: "/UserAdmin/vendors" },
      ],
    },
    { name: "Activity", href: "/UserAdmin/activity", icon: Rocket },
  ],
}

// Support for both naming conventions
roleNavigationMap["User" as Role] = roleNavigationMap.UserAdmin;
roleNavigationMap["Client" as Role] = roleNavigationMap.ClientAdmin;



// import {
//   Home,
//   BookOpen,
//   Rocket,
//   Users,
//   Book,
//   UserPlus,
//   BarChart3,
//   Share2,
//   User,
//   Settings,
//   ChevronDown,
//   Menu,
//   X,
//   UserCog,
//   Package,
//   Globe
// } from "lucide-react"

// export const navigationTabs = [
//   { name: "Dashboard", href: "/SuperAdmin/dashboard",  icon: Home },
//   { name: "User Management", href: "/SuperAdmin/user-management", icon: UserCog, hasDropdown: true, hasSubmenu: true, submenu: [
//     { name: "Client", href: "/SuperAdmin/clients" },
//     { name: "User Admin", href: "/SuperAdmin/users" }
//   ] },
//     { name: "Products", href: "/SuperAdmin/products", hasSubmenu: false, icon: Package  },
//   { name: "Domain", href: "/SuperAdmin/domain", hasSubmenu: false, icon: Globe  },
//   { name: "Domains", href: "/SuperAdmin/domains", hasSubmenu: false, icon: Globe  },
//   { name: "Counter", href: "/SuperAdmin/counter", hasDropdown: false, hasSubmenu: false, icon: BookOpen },
//   { name: "Emails", href: "/SuperAdmin/sub-email", hasDropdown: false, hasSubmenu: false, icon: Rocket, },
//   { name: "Hosting", href: "/SuperAdmin/hosting", hasDropdown: false, hasSubmenu: false },
//   { name: "Search Result", href: "/SuperAdmin/search-result", hasDropdown: false, hasSubmenu: false, icon: Users, },
//   { name: "SSL", href: "/SuperAdmin/ssl", hasDropdown: false, icon: Book },
//   { name: "Subcription", href: "/SuperAdmin/subscription", hasDropdown: false, icon: UserPlus },
//   // { name: "Team Training", href: "/SuperAdmin/team-training", hasDropdown: true },
//   // { name: "EBook", href: "/SuperAdmin/ebooks", hasDropdown: true },
//   // { name: "Enrollments", href: "/SuperAdmin/enrollments", hasDropdown: true },
//   // { name: "Reports", href: "/SuperAdmin/reports", hasDropdown: true },
//   // { name: "Affiliate", href: "/SuperAdmin/affiliate" },
// ]
