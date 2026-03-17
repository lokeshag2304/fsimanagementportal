"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout";
import { StatsRow } from "@/components/shared";
import { AreaChart, DonutChart } from "@/components/charts";
import { GlassCard } from "@/components/glass/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/theme-context";
import {
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  ArrowRight,
  Maximize2,
  Minimize2,
  BarChart3,
  Search,
  TrendingUp,
  ShoppingCart,
  UserCircle,
  BookMarked,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  Server,
  Globe,
} from "lucide-react";
import api from "@/lib/api";

import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/common/Pagination";
import { getNavigationByRole } from "@/lib/getNavigationByRole";
import DashboardLoader from "@/common/DashboardLoader";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import SearchResultsPage from "../search-result/page";
import { subscribeEntity } from "@/lib/entityBus";
import { formatLastUpdated } from "@/utils/dateFormatter";
import { getCurrencySymbol, currencySymbols } from "@/utils/currencies";



// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// API types
export interface SubscriptionItem {
  id: number;
  product: string;
  client: string;
  amount: string;
  currency?: string;
  renewal_date: string;
  deletion_date: string | null;
  days_left: number;
  days_to_delete: number | null;
  status: number;
  remarks: string | null;
  updated_at: string | null;
  grace_period?: number;
  due_date?: string | null;
}

interface PaginationState {
  page: number;
  rowsPerPage: number;
  total: number;
}


export default function Dashboard() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [Mainloading, setMainLoading] = useState(true);
  const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [orderBy, setOrderBy] = useState<string>("id");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    rowsPerPage: 100,
    total: 0,
  });
  const [counts, setCounts] = useState({
    subscription: 0,
    ssl: 0,
    hosting: 0,
    domains: 0,
    emails: 0,
    counter: 0
  });

  const { colors } = useTheme();
  const { user, getToken } = useAuth();
  const token = getToken();
  const navigationTabs = getNavigationByRole(user?.role);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // ⏱️ debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check if token exists
      if (!token) {
        console.warn("No authentication token found");
        setSubscriptionsData([]);
        setMainLoading(false);
        return;
      }

      const params = {
        start_date: startDate,
        end_date: endDate,
        search: searchQuery,
        orderBy: orderBy,
        orderDir: orderDir,
        s_id: user?.id || "",
      };

      // Fetch counting data
      try {
        const countsResponse = await api.post(
          "/secure/dashboard/counting",
          params,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Dashboard Counts Response:", countsResponse.data);

        // Safe extraction
        const safeData = countsResponse?.data?.data || {};

        setCounts(prev => ({
          ...prev,
          subscription: safeData.subscription ?? safeData.subscriptions ?? 0,
          ssl: safeData.ssl ?? 0,
          hosting: safeData.hosting ?? safeData.hostings ?? 0,
          domains: safeData.domains ?? safeData.domain ?? 0,
          emails: safeData.emails ?? safeData.email ?? 0,
          counter: safeData.counter ?? safeData.counters ?? 0
        }));

      } catch (countError: any) {
        console.warn("Counting API Error:", countError);
      }

      if (user?.role !== "ClientAdmin" && user?.role !== "client" && user?.role !== "Client") {
        const response = await api.get<SubscriptionItem[]>(
          "/secure/dashboard/subscriptions",
          {
            params,
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response?.data && Array.isArray(response.data)) {
          setSubscriptionsData(response.data);
        } else {
          setSubscriptionsData([]);
        }
      } else {
        setSubscriptionsData([]);
      }
    } catch (error: any) {
      console.warn("Error fetching dashboard data:", error);
      if (error?.response?.status === 401) {
        console.warn("Unauthorized: Token may be invalid or expired");
      }
      setSubscriptionsData([]);
    } finally {
      setLoading(false);
      setMainLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchDashboardData().catch(err => console.warn("Load failed", err));
  }, [
    pagination.page,
    pagination.rowsPerPage,
    orderBy,
    orderDir,
    debouncedSearch,
  ]);

  useEffect(() => {
    const unsub = subscribeEntity('all', () => {
      fetchDashboardData().catch(err => console.warn(err));
    });
    return () => unsub();
  }, [startDate, endDate, searchQuery, orderBy, orderDir, user]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // Handle search
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchDashboardData().catch(err => console.warn("Load failed", err));
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDir(orderDir === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(column);
      setOrderDir("desc");
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "N/A";
    // If it already looks formatted like 'j/n/Y' (has slashes), return it as is
    if (dateString.includes('/')) return dateString;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      // Check if it's just a date (YYYY-MM-DD) or has time
      const hasTime = dateString.includes('T') || dateString.includes(':');

      if (hasTime) {
        return date.toLocaleString("en-GB", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true
        }).toLowerCase();
      } else {
        return date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "numeric",
          year: "numeric"
        });
      }
    } catch (e) {
      return dateString;
    }
  };
  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "deactive":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Dynamic stats
  const statsData = {
    courses: {
      total: 0,
      active: 0,
      upcoming: 0,
    },
    lessons: {
      total: 0,
      active: 0,
      upcoming: 0,
    },
    enrollments: {
      total: 0,
      passed: 0,
      new: 0,
    },
    students: {
      total: 0,
      active: 0,
      new: 0,
    },
  };

  if (Mainloading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <DashboardLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <Header
        title="Dashboard Overview"
        tabs={navigationTabs}
      />

      <div className="px-4 sm:px-6 mt-6">
        {/* Date Filter Section */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-3 bg-[var(--glass)] border border-[rgba(255,255,255,0.08)] p-1.5 rounded-xl">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs bg-transparent text-[var(--text-primary)] focus:outline-none appearance-none"
              placeholder="dd-mm-yyyy"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs bg-transparent text-[var(--text-primary)] focus:outline-none appearance-none border-l border-[rgba(255,255,255,0.08)]"
              placeholder="dd-mm-yyyy"
            />
            <Button
              onClick={fetchDashboardData}
              disabled={loading}
              variant="glass"
              size="sm"
              className="px-4 py-1 h-7 text-xs bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] rounded-lg text-white"
            >
              {loading ? "..." : "Apply Filter"}
            </Button>
          </div>
        </div>

        {/* Dynamic Stats Row */}
        <GlassCard variant="liquid" noPadding className="overflow-hidden mb-6 hidden-border">
          <StatsRow
            className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
            stats={[
              {
                title: "Subscription",
                value: counts.subscription,
                icon: (
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                ),
                url: `${user?.role}/subscription`,
              },
              {
                title: "SSL",
                value: counts.ssl,
                icon: <Shield className="w-5 h-5 text-green-400" />,
                url: `${user?.role}/ssl`,
              },
              {
                title: "Hosting",
                value: counts.hosting,
                icon: <Server className="w-5 h-5 text-purple-400" />,
                url: `${user?.role}/hosting`,
              },
              {
                title: "Domains",
                value: counts.domains,
                icon: <Globe className="w-5 h-5 text-orange-400" />,
                url: `${user?.role}/domains`,
              },
              {
                title: "Emails",
                value: counts.emails,
                icon: <BookOpen className="w-5 h-5 text-red-400" />,
                url: `${user?.role}/sub-email`,
              },
              {
                title: "Counter",
                value: counts.counter,
                icon: <BarChart3 className="w-5 h-5 text-indigo-400" />,
                url: `${user?.role}/counter`,
              },
            ]}
          />
        </GlassCard>
        <div className="mb-6">
          <SearchResultsPage query={searchQuery} onSearchChange={setSearchQuery} />
        </div>

        {/* Recent Subscriptions Table */}
        <GlassCard variant="liquid" noPadding className="overflow-hidden mb-6 hidden-border">
          <div className="p-4 sm:p-5">
            <h3 className="text-[var(--text-tertiary)] font-medium text-sm sm:text-base mb-4">
              Recent Subscriptions
            </h3>
            <div className="overflow-auto rounded-lg border border-white/[0.08] max-h-[400px]">
              <table className="w-full relative">
                <thead className="bg-[#1A1A1A] border-b border-white/[0.08] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Sr No</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Product</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Client</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Renewal Date</th>
                    {user?.role !== 'ClientAdmin' && user?.role !== 'Client' && user?.role !== 'client' && (
                      <>
                        <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Grace Period</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Due Date</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08]">
                  {subscriptionsData && subscriptionsData.length > 0 ? (
                    subscriptionsData.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                        <td className="py-3 px-4 text-sm text-[var(--text-primary)]">{index + 1}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-primary)] font-medium capitalize">{item.product || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-[var(--text-muted)] capitalize">{item.client || "N/A"}</td>
                         <td className="py-3 px-4 text-sm text-[var(--text-primary)] font-medium text-green-400">
                           {getCurrencySymbol(item.currency)}
                           {item.amount ? Number(item.amount).toFixed(2) : "0.00"}
                         </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{formatDateForDisplay(item.renewal_date || "")}</td>
                        {user?.role !== 'ClientAdmin' && user?.role !== 'Client' && user?.role !== 'client' && (
                          <>
                            <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{item.grace_period ?? 0} days</td>
                            <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{formatDateForDisplay(item.due_date || "")}</td>
                          </>
                        )}
                        <td className="py-3 px-4">
                          <Badge variant={item.status === 1 ? "success" : "secondary"}>
                            {item.status === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{formatLastUpdated(item.updated_at || "")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user?.role !== 'ClientAdmin' && user?.role !== 'Client' && user?.role !== 'client' ? 9 : 7} className="py-8 text-center text-[var(--text-muted)]">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// "use client"

// import { useState } from "react"
// import Image from "next/image"
// import { motion, AnimatePresence } from "framer-motion"
// import { Header } from "@/components/layout"
// import { StatsRow } from "@/components/shared"
// import { AreaChart, DonutChart } from "@/components/charts"
// import { GlassCard } from "@/components/glass/glass-card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   statsData,
//   revenueData,
//   withdrawalRequests,
//   topCourses,
//   courseOverviewData
// } from "@/lib/mock-data"
// import { navigationTabs } from "@/lib/navigation"
// import { useTheme } from "@/contexts/theme-context"
// import {
//   GraduationCap,
//   BookOpen,
//   Users,
//   UserCheck,
//   ArrowRight,
//   Maximize2,
//   Minimize2,
//   BarChart3,
//   Search,
//   TrendingUp,
//   ShoppingCart,
//   UserCircle,
//   BookMarked
// } from "lucide-react"

// const bestSellingCourses = [...topCourses].sort((a, b) => b.sales - a.sales)

// // Staggered animation variants
// const containerVariants = {
//   hidden: { opacity: 0 },
//   visible: {
//     opacity: 1,
//     transition: {
//       staggerChildren: 0.08,
//       delayChildren: 0.05
//     }
//   }
// }

// const itemVariants = {
//   hidden: {
//     opacity: 0,
//     y: -15,
//     scale: 0.95
//   },
//   visible: {
//     opacity: 1,
//     y: 0,
//     scale: 1,
//     transition: {
//       type: "spring",
//       stiffness: 300,
//       damping: 24
//     }
//   }
// }

// export default function Dashboard() {
//   const [courseTab, setCourseTab] = useState<'top' | 'best'>('top')
//   const { colors } = useTheme()

//   const displayedCourses = courseTab === 'top' ? topCourses : bestSellingCourses

//   // Legend colors from theme
//   const legendColors = [
//     colors.chartColors.primary,
//     colors.chartColors.secondary,
//     colors.chartColors.tertiary,
//     colors.gradientTo,
//     colors.chartColors.primary + "cc",
//     colors.chartColors.secondary + "cc"
//   ]

//   return (
//     <div className="min-h-screen pb-8">
//       <Header title="Dashboard Overview" tabs={navigationTabs} />

//       <div className="px-4 sm:px-6 space-y-6 mt-6">
//         <StatsRow
//           stats={[
//             {
//               title: "Courses",
//               value: statsData.courses.total,
//               icon: <GraduationCap className="w-5 h-5 text-[var(--text-muted)]" />,
//               subStats: [
//                 { label: "Active Courses", value: statsData.courses.active },
//                 { label: "Upcoming Courses", value: statsData.courses.upcoming },
//               ],
//             },
//             {
//               title: "Number of Lessons",
//               value: statsData.lessons.total,
//               icon: <BookOpen className="w-5 h-5 text-[var(--text-muted)]" />,
//               subStats: [
//                 { label: "Active Lessons", value: statsData.lessons.active },
//                 { label: "Upcoming Lessons", value: statsData.lessons.upcoming },
//               ],
//             },
//             {
//               title: "Number of Enrollment",
//               value: statsData.enrollments.total,
//               icon: <UserCheck className="w-5 h-5 text-[var(--text-muted)]" />,
//               subStats: [
//                 { label: "Passes Enrollment", value: statsData.enrollments.passed },
//                 { label: "New Enrollment", value: statsData.enrollments.new },
//               ],
//             },
//             {
//               title: "Number of Students",
//               value: statsData.students.total,
//               icon: <Users className="w-5 h-5 text-[var(--text-muted)]" />,
//               subStats: [
//                 { label: "Active Students", value: statsData.students.active },
//                 { label: "New Students", value: statsData.students.new },
//               ],
//             },
//           ]}
//         />

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//           <GlassCard variant="liquid" noPadding>
//             <div className="p-4 sm:p-5">
//               <div className="flex items-center justify-between mb-4 sm:mb-6">
//                 <h3 className="text-[var(--text-tertiary)] font-medium text-sm sm:text-base">Admin Revenue</h3>
//                 <div className="flex items-center gap-1 sm:gap-2">
//                   <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                     <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
//                   </Button>
//                   <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                     <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
//                   </Button>
//                   <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                     <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
//                   </Button>
//                   <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                     <Search className="w-3 h-3 sm:w-4 sm:h-4" />
//                   </Button>
//                   <Select defaultValue="year">
//                     <SelectTrigger className="w-[95px] sm:w-[120px] h-7 sm:h-8 glass-input border-white/[0.08] text-[var(--text-tertiary)] text-[10px] sm:text-sm">
//                       <SelectValue placeholder="Period" />
//                     </SelectTrigger>
//                     <SelectContent className="glass-dropdown border-white/[0.08] min-w-0 w-[95px] sm:w-[120px]">
//                       <SelectItem value="year">Year</SelectItem>
//                       <SelectItem value="month">Month</SelectItem>
//                       <SelectItem value="week">Week</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <div className="h-[200px] sm:h-[280px]">
//                 <AreaChart data={revenueData} xKey="month" yKey="revenue" />
//               </div>
//             </div>
//           </GlassCard>

//           <GlassCard variant="liquid" noPadding>
//             <div className="p-4 sm:p-5">
//               <div className="flex items-center justify-between mb-4 sm:mb-6">
//                 <h3 className="text-[var(--text-tertiary)] font-medium text-sm sm:text-base">Requested Withdrawal</h3>
//                 <div className="flex items-center gap-1 sm:gap-2">
//                   <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                     <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
//                   </Button>
//                   <Select defaultValue="year">
//                     <SelectTrigger className="w-[95px] sm:w-[120px] h-7 sm:h-8 glass-input border-white/[0.08] text-[var(--text-tertiary)] text-[10px] sm:text-sm">
//                       <SelectValue placeholder="Period" />
//                     </SelectTrigger>
//                     <SelectContent className="glass-dropdown border-white/[0.08] min-w-0 w-[95px] sm:w-[120px]">
//                       <SelectItem value="year">Year</SelectItem>
//                       <SelectItem value="month">Month</SelectItem>
//                       <SelectItem value="week">Week</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               <motion.div
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//                 className="space-y-2 sm:space-y-3"
//               >
//                 {withdrawalRequests.map((request) => (
//                   <motion.div
//                     key={request.id}
//                     variants={itemVariants}
//                     className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors duration-300"
//                   >
//                     <div className="flex items-center gap-2 sm:gap-3">
//                       <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                         <AvatarImage src={request.avatar} alt={request.name} />
//                         <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
//                       </Avatar>
//                       <div className="min-w-0">
//                         <p className="text-[var(--text-muted)] text-[10px] sm:text-xs truncate">{request.email}</p>
//                         <p className="text-[var(--text-primary)] font-medium text-xs sm:text-sm truncate">{request.name}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
//                       <div className="text-right">
//                         <p className="text-[var(--text-muted)] text-[10px] sm:text-xs">Amount</p>
//                         <p className="text-[var(--text-primary)] font-semibold text-sm sm:text-base">${request.amount.toFixed(2)}</p>
//                       </div>
//                       <Button
//                         variant="glass"
//                         size="icon"
//                         className="rounded-full w-7 h-7 sm:w-9 sm:h-9"
//                       >
//                         <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
//                       </Button>
//                     </div>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </div>
//           </GlassCard>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//           <GlassCard variant="liquid" noPadding>
//             <div className="p-4 sm:p-5">
//               <div className="flex items-center justify-between mb-4 sm:mb-6">
//                 <div className="flex gap-3 sm:gap-4">
//                   <button
//                     onClick={() => setCourseTab('top')}
//                     className={`font-medium text-xs sm:text-sm pb-2 border-b-2 transition-colors ${
//                       courseTab === 'top'
//                         ? 'text-[var(--text-primary)] border-[var(--text-primary)]/60'
//                         : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-tertiary)]'
//                     }`}
//                   >
//                     Top Courses
//                   </button>
//                   <button
//                     onClick={() => setCourseTab('best')}
//                     className={`font-medium text-xs sm:text-sm pb-2 border-b-2 transition-colors ${
//                       courseTab === 'best'
//                         ? 'text-[var(--text-primary)] border-[var(--text-primary)]/60'
//                         : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-tertiary)]'
//                     }`}
//                   >
//                     Best Selling
//                   </button>
//                 </div>
//                 <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                   <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
//                 </Button>
//               </div>
//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={courseTab}
//                   variants={containerVariants}
//                   initial="hidden"
//                   animate="visible"
//                   className="space-y-2"
//                 >
//                   {displayedCourses.map((course) => (
//                     <motion.div
//                       key={course.id}
//                       variants={itemVariants}
//                       className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-[rgba(255,255,255,var(--ui-opacity-5))] transition-colors duration-300"
//                     >
//                       <div className="flex items-center gap-2 sm:gap-3 min-w-0">
//                         <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-white/[0.04] flex-shrink-0">
//                           <Image
//                             src={course.image}
//                             alt={course.name}
//                             width={40}
//                             height={40}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                         <span className="text-[var(--text-primary)] font-medium text-xs sm:text-sm truncate">{course.name}</span>
//                       </div>
//                       <Badge className="bg-[rgba(255,255,255,var(--ui-opacity-10))] text-[var(--text-secondary)] border-[rgba(255,255,255,var(--glass-border-opacity))] px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium flex-shrink-0">
//                         {course.sales} Sales
//                       </Badge>
//                     </motion.div>
//                   ))}
//                 </motion.div>
//               </AnimatePresence>
//             </div>
//           </GlassCard>

//           <GlassCard variant="liquid" noPadding>
//             <div className="p-4 sm:p-5">
//               <div className="flex items-center justify-between mb-4 sm:mb-6">
//                 <h3 className="text-[var(--text-primary)] font-medium text-sm sm:text-base">Course Overview</h3>
//                 <div className="flex items-center gap-1 sm:gap-2">
//                   <Button variant="glass" size="icon-sm" className="flex rounded-lg w-6 h-6 sm:w-8 sm:h-8">
//                     <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
//                   </Button>
//                   <Select defaultValue="7days">
//                     <SelectTrigger className="w-[95px] sm:w-[120px] h-7 sm:h-8 glass-input border-white/[0.08] text-[var(--text-tertiary)] text-[10px] sm:text-sm">
//                       <SelectValue placeholder="Period" />
//                     </SelectTrigger>
//                     <SelectContent className="glass-dropdown border-white/[0.08] min-w-0 w-[95px] sm:w-[120px]">
//                       <SelectItem value="7days">7 Days</SelectItem>
//                       <SelectItem value="30days">30 Days</SelectItem>
//                       <SelectItem value="90days">90 Days</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//               {/* Mobile Layout */}
//               <div className="lg:hidden">
//                 <div className="flex items-start gap-4">
//                   {/* Donut Chart - Sol */}
//                   <div className="flex-shrink-0 w-[120px] h-[120px]">
//                     <DonutChart data={courseOverviewData} innerRadius={35} outerRadius={55} centerValue="27%" />
//                   </div>

//                   {/* Stats - Sağ */}
//                   <div className="flex-1 min-w-0">
//                     <p className="text-[var(--text-primary)] font-medium text-sm">XII Crash Course</p>
//                     <div className="flex items-center gap-1.5 mt-1">
//                       <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" />
//                       <span className="text-[var(--text-muted)] text-xs">Increased</span>
//                       <span className="text-green-400 font-bold text-base">270%</span>
//                     </div>

//                     <div className="grid grid-cols-3 gap-2 mt-3">
//                       <div className="flex items-center gap-1.5">
//                         <ShoppingCart className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
//                         <div>
//                           <p className="text-[var(--text-muted)] text-[10px]">Sell</p>
//                           <p className="text-[var(--text-primary)] font-semibold text-sm">12</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-1.5">
//                         <UserCircle className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
//                         <div>
//                           <p className="text-[var(--text-muted)] text-[10px]">Students</p>
//                           <p className="text-[var(--text-primary)] font-semibold text-sm">8</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-1.5">
//                         <BookMarked className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
//                         <div>
//                           <p className="text-[var(--text-muted)] text-[10px]">Lessons</p>
//                           <p className="text-[var(--text-primary)] font-semibold text-sm">16/24</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Legend + Total Pending - Alt kısım */}
//                 <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(255,255,255,var(--glass-border-opacity))]">
//                   <div className="flex flex-wrap gap-x-3 gap-y-1">
//                     {courseOverviewData.map((item, index) => (
//                       <div key={item.name} className="flex items-center gap-1.5">
//                         <div
//                           className="w-2 h-2 rounded-full flex-shrink-0"
//                           style={{ backgroundColor: legendColors[index % legendColors.length] }}
//                         />
//                         <span className="text-[var(--text-muted)] text-[10px]">{item.name}</span>
//                       </div>
//                     ))}
//                   </div>
//                   <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-[rgba(255,255,255,var(--glass-border-opacity))] flex-shrink-0">
//                     <BookOpen className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
//                     <span className="text-[var(--text-tertiary)] text-[10px]">Pending</span>
//                     <span className="text-[var(--text-primary)] font-bold text-sm">4</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Desktop Layout */}
//               <div className="hidden lg:grid lg:grid-cols-[1fr_1.5fr_1fr] gap-4">
//                 {/* Sol - İstatistikler */}
//                 <div className="flex flex-col items-start gap-4">
//                   <div>
//                     <p className="text-[var(--text-primary)] font-medium text-base">XII Crash Course</p>
//                     <div className="flex items-center gap-2 mt-2">
//                       <TrendingUp className="w-5 h-5 text-[var(--text-muted)]" />
//                       <span className="text-[var(--text-muted)] text-sm">Increased</span>
//                       <span className="text-green-400 font-bold text-xl">270%</span>
//                     </div>
//                   </div>

//                   <div className="flex flex-col gap-3">
//                     <div className="flex items-center gap-3">
//                       <ShoppingCart className="w-5 h-5 text-white/30 flex-shrink-0" />
//                       <div>
//                         <p className="text-[var(--text-muted)] text-xs">New Sell</p>
//                         <p className="text-[var(--text-primary)] font-semibold text-base">12</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <UserCircle className="w-5 h-5 text-white/30 flex-shrink-0" />
//                       <div>
//                         <p className="text-[var(--text-muted)] text-xs">Active Students</p>
//                         <p className="text-white font-semibold text-base">8</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <BookMarked className="w-5 h-5 text-white/30 flex-shrink-0" />
//                       <div>
//                         <p className="text-[var(--text-muted)] text-xs">Lesson Completed</p>
//                         <p className="text-white font-semibold text-base">16 of 24</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Orta - Donut Chart */}
//                 <div className="flex items-center justify-center min-w-0 overflow-visible">
//                   <div className="w-full h-[220px] min-w-[180px] max-w-[220px]">
//                     <DonutChart data={courseOverviewData} innerRadius={60} outerRadius={95} centerValue="27%" />
//                   </div>
//                 </div>

//                 {/* Sağ - Legend ve özet */}
//                 <div className="flex flex-col items-end gap-4">
//                   {/* Legend items - dikey liste */}
//                   <div className="flex flex-col gap-1.5">
//                     {courseOverviewData.map((item, index) => (
//                       <div key={item.name} className="flex items-center gap-2">
//                         <div
//                           className="w-2.5 h-2.5 rounded-full flex-shrink-0"
//                           style={{ backgroundColor: legendColors[index % legendColors.length] }}
//                         />
//                         <span className="text-[var(--text-tertiary)] text-xs">{item.name}</span>
//                       </div>
//                     ))}
//                   </div>

//                   {/* SAĞ - Total Pending */}
//                   <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(255,255,255,var(--ui-opacity-5))] border border-[rgba(255,255,255,var(--glass-border-opacity))] flex-shrink-0">
//                     <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,var(--ui-opacity-10))] flex items-center justify-center flex-shrink-0">
//                       <BookOpen className="w-4 h-4 text-[var(--text-tertiary)]" />
//                     </div>
//                     <span className="text-[var(--text-tertiary)] text-xs">Total Pending</span>
//                     <span className="text-white font-bold text-base">4</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </GlassCard>
//         </div>
//       </div>
//     </div>
//   )
// }
