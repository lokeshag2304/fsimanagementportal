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

type Role = "SuperAdmin" | "Admin" | "Client" | "User"

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
      { name: "Products", href: "/SuperAdmin/products"},
    { name: "Domain", href: "/SuperAdmin/domain" },
    { name: "Search Result", href: "/SuperAdmin/search-result"},
  ],
},
 { name: "Activity", href: "/SuperAdmin/activity", icon: Rocket },
  ],

  Admin: [
    { name: "Dashboard", href: "/Admin/dashboard", icon: Home },
    { name: "Users", href: "/Admin/users", icon: Users },
    { name: "Products", href: "/Admin/products", icon: Package },
    { name: "Domains", href: "/Admin/domains", icon: Globe },
  ],

  Client: [
    { name: "Dashboard", href: "/Client/dashboard", icon: Home },
    { name: "My Domains", href: "/Client/domains", icon: Globe },
    { name: "Billing", href: "/Client/billing", icon: Book },
  ],

  User: [
    { name: "Dashboard", href: "/User/dashboard", icon: X },
  ],
}



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
