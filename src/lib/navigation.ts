export const navigationTabs = [
  { name: "Dashboard", href: "/" },
  { name: "User Management", href: "/SuperAdmin/user-management", hasDropdown: true, submenu: [
    { name: "Client", href: "/SuperAdmin/clients" },
    { name: "User Admin", href: "/SuperAdmin/user" }
  ] },
    { name: "Products", href: "/SuperAdmin/products" },
  { name: "Domain", href: "/SuperAdmin/domain" },
  { name: "Domains", href: "/SuperAdmin/domains" },
  { name: "Counter", href: "/SuperAdmin/counter", hasDropdown: false },
  { name: "Emails", href: "/SuperAdmin/sub-email", hasDropdown: false },
  { name: "Hosting", href: "/SuperAdmin/hosting", hasDropdown: false },
  { name: "Search Result", href: "/SuperAdmin/search-result", hasDropdown: false },
  { name: "SSL", href: "/SuperAdmin/ssl", hasDropdown: false },
  { name: "Subcription", href: "/SuperAdmin/subcription", hasDropdown: false },
  // { name: "Team Training", href: "/SuperAdmin/team-training", hasDropdown: true },
  // { name: "EBook", href: "/SuperAdmin/ebooks", hasDropdown: true },
  // { name: "Enrollments", href: "/SuperAdmin/enrollments", hasDropdown: true },
  // { name: "Reports", href: "/SuperAdmin/reports", hasDropdown: true },
  // { name: "Affiliate", href: "/SuperAdmin/affiliate" },
]