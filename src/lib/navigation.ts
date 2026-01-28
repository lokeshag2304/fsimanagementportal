import {
  Home,
  BookOpen,
  Rocket,
  Users,
  Book,
  UserPlus,
  BarChart3,
  Share2,
  User,
  Settings,
  ChevronDown,
  Menu,
  X,
  UserCog,
  Package,
  Globe
} from "lucide-react"

export const navigationTabs = [
  { name: "Dashboard", href: "/",  icon: Home },
  { name: "User Management", href: "/SuperAdmin/user-management", icon: UserCog, hasDropdown: true, hasSubmenu: true, submenu: [
    { name: "Client", href: "/SuperAdmin/clients" },
    { name: "User Admin", href: "/SuperAdmin/users" }
  ] },
    { name: "Products", href: "/SuperAdmin/products", hasSubmenu: false, icon: Package  },
  { name: "Domain", href: "/SuperAdmin/domain", hasSubmenu: false, icon: Globe  },
  { name: "Domains", href: "/SuperAdmin/domains", hasSubmenu: false, icon: Globe  },
  { name: "Counter", href: "/SuperAdmin/counter", hasDropdown: false, hasSubmenu: false, icon: BookOpen },
  { name: "Emails", href: "/SuperAdmin/sub-email", hasDropdown: false, hasSubmenu: false, icon: Rocket, },
  { name: "Hosting", href: "/SuperAdmin/hosting", hasDropdown: false, hasSubmenu: false },
  { name: "Search Result", href: "/SuperAdmin/search-result", hasDropdown: false, hasSubmenu: false, icon: Users, },
  { name: "SSL", href: "/SuperAdmin/ssl", hasDropdown: false, icon: Book },
  { name: "Subcription", href: "/SuperAdmin/subcription", hasDropdown: false, icon: UserPlus },
  // { name: "Team Training", href: "/SuperAdmin/team-training", hasDropdown: true },
  // { name: "EBook", href: "/SuperAdmin/ebooks", hasDropdown: true },
  // { name: "Enrollments", href: "/SuperAdmin/enrollments", hasDropdown: true },
  // { name: "Reports", href: "/SuperAdmin/reports", hasDropdown: true },
  // { name: "Affiliate", href: "/SuperAdmin/affiliate" },
]