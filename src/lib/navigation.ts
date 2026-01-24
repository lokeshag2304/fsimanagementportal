export const navigationTabs = [
  { name: "Dashboard", href: "/" },
  { name: "User Management", href: "/SuperAdmin/user-management", hasDropdown: true, submenu: [
    { name: "Support Admin", href: "/user-management/support-admin" },
    { name: "Customer Admin", href: "/user-management/customer-admin" }
  ] },
  { name: "Courses", href: "/SuperAdmin/courses", hasDropdown: true },
  { name: "Bootcamp", href: "/SuperAdmin/bootcamp", hasDropdown: true },
  { name: "Team Training", href: "/SuperAdmin/team-training", hasDropdown: true },
  { name: "EBook", href: "/SuperAdmin/ebooks", hasDropdown: true },
  { name: "Enrollments", href: "/SuperAdmin/enrollments", hasDropdown: true },
  { name: "Reports", href: "/SuperAdmin/reports", hasDropdown: true },
  { name: "Affiliate", href: "/SuperAdmin/affiliate" },
]