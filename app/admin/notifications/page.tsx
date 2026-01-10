"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Users, CreditCard, Ticket, ShoppingCart, Search, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationType = "all" | "users" | "subscriptions" | "tickets" | "purchases";

interface Notification {
  id: string;
  type: "user" | "subscription" | "ticket" | "purchase";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "yesterday" | "week" | "today">("today");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const convexNotifications = useQuery(api.adminNotifications.getNotifications) || [];
  const markAsReadMutation = useMutation(api.adminNotifications.markAsRead);
  const forceFixMutation = useMutation(api.forceFixAll.markAllAsRead);
  const [isFixing, setIsFixing] = useState(false);
  const [isForceFixing, setIsForceFixing] = useState(false);
  const router = useRouter();
  
  // Convert Convex notifications to component format
  const notifications: Notification[] = convexNotifications.map((n: any) => ({
    id: n.id,
    type: n.type === "new_subscription" || n.type === "subscription_canceled" ? "subscription" :
          n.type === "new_purchase" ? "purchase" :
          n.type === "new_ticket" ? "ticket" : "user",
    title: n.title,
    description: n.description,
    time: formatTimeAgo(n.time),
    read: n.read,
  }));

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "subscription":
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case "ticket":
        return <Ticket className="h-5 w-5 text-orange-500" />;
      case "purchase":
        return <ShoppingCart className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesTab = activeTab === "all" || notification.type === activeTab.slice(0, -1);
      const matchesSearch =
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by read status
      const matchesReadStatus = !showUnreadOnly || !notification.read;
      
      // Filter by time filter
      let matchesTimeFilter = true;
      const originalNotif = convexNotifications.find((n: any) => n.id === notification.id);
      if (originalNotif && timeFilter !== "all") {
        const notifDate = new Date(originalNotif.time);
        const now = new Date();
        
        if (timeFilter === "today") {
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          matchesTimeFilter = notifDate >= today;
        } else if (timeFilter === "yesterday") {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(yesterday);
          yesterdayEnd.setHours(23, 59, 59, 999);
          matchesTimeFilter = notifDate >= yesterday && notifDate <= yesterdayEnd;
        } else if (timeFilter === "week") {
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          matchesTimeFilter = notifDate >= oneWeekAgo;
        }
      }
      
      // Filter by date range
      let matchesDateRange = true;
      if (startDate || endDate) {
        if (originalNotif) {
          const notifDate = new Date(originalNotif.time);
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (notifDate < start) matchesDateRange = false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (notifDate > end) matchesDateRange = false;
          }
        }
      }
      
      return matchesTab && matchesSearch && matchesReadStatus && matchesTimeFilter && matchesDateRange;
    });
  }, [notifications, activeTab, searchTerm, showUnreadOnly, timeFilter, startDate, endDate, convexNotifications]);
  
  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string, type: string) => {
    await markAsReadMutation({ notificationId: id, type });
  };

  const markAllAsRead = async () => {
    try {
      setIsFixing(true);
      
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.read);
      
      if (unreadNotifications.length === 0) {
        alert('No unread notifications to mark as read.');
        setIsFixing(false);
        return;
      }
      
      console.log(`Marking ${unreadNotifications.length} notifications as read...`);
      
      for (const n of unreadNotifications) {
        const originalNotif = convexNotifications.find((cn: any) => cn.id === n.id);
        if (originalNotif) {
          await markAsReadMutation({ notificationId: n.id, type: originalNotif.type });
        }
      }
      
      console.log('All notifications marked as read successfully!');
      alert('All visible notifications marked as read!');
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Failed to mark all as read. Please try again.');
    } finally {
      setIsFixing(false);
    }
  };

  const forceFixNotifications = async () => {
    if (!confirm('This will mark ALL notifications (including the 5 unread subscriptions) as read. Continue?')) {
      return;
    }
    
    try {
      setIsForceFixing(true);
      console.log('Running force fix - marking ALL notifications as read...');
      
      // Call the mutation that marks ALL notifications as read (no limits)
      const result = await forceFixMutation({});
      
      console.log('Force fix result:', result);
      alert(`Success! Marked ${result.markedCount} notifications as read. The page will refresh.`);
      window.location.reload();
      
    } catch (error) {
      console.error('Error force fixing:', error);
      alert('Failed to force fix. Error: ' + (error as Error).message);
    } finally {
      setIsForceFixing(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    const originalNotif = convexNotifications.find((n: any) => n.id === notification.id);
    if (originalNotif) {
      await markAsReadMutation({ notificationId: notification.id, type: originalNotif.type });
      
      // Navigate to relevant page
      switch (originalNotif.type) {
        case "new_subscription":
        case "subscription_canceled":
          router.push("/admin/subscriptions");
          break;
        case "new_purchase":
          router.push("/admin/purchases");
          break;
        case "new_ticket":
          router.push("/admin/tickets");
          break;
      }
    }
  };

  // Calculate stats based on current filter
  const getFilteredNotificationsForStats = () => {
    const now = new Date();
    return notifications.filter((notification) => {
      const originalNotif = convexNotifications.find((n: any) => n.id === notification.id);
      if (!originalNotif) return false;
      
      const notifDate = new Date(originalNotif.time);
      
      if (timeFilter === "yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return notifDate >= yesterday && notifDate <= yesterdayEnd;
      } else if (timeFilter === "week") {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return notifDate >= oneWeekAgo;
      } else {
        // Default to current day
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return notifDate >= today;
      }
    });
  };
  
  const statsNotifications = timeFilter === "all" ? notifications : getFilteredNotificationsForStats();
  
  const stats = [
    { label: "All", count: statsNotifications.length, icon: Bell, color: "text-primary" },
    { label: "Users", count: statsNotifications.filter((n) => n.type === "user").length, icon: Users, color: "text-blue-500" },
    {
      label: "Subscriptions",
      count: statsNotifications.filter((n) => n.type === "subscription").length,
      icon: CreditCard,
      color: "text-green-500",
    },
    { label: "Tickets", count: statsNotifications.filter((n) => n.type === "ticket").length, icon: Ticket, color: "text-orange-500" },
    {
      label: "Purchases",
      count: statsNotifications.filter((n) => n.type === "purchase").length,
      icon: ShoppingCart,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with system activities and events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={markAllAsRead} variant="outline" disabled={unreadCount === 0 || isFixing}>
            <Check className="mr-2 h-4 w-4" />
            {isFixing ? 'Fixing...' : 'Mark all as read'}
          </Button>
          <Button onClick={forceFixNotifications} variant="destructive" disabled={isForceFixing} title="Force mark ALL notifications from last 7 days as read">
            <Check className="mr-2 h-4 w-4" />
            {isForceFixing ? 'Fixing...' : 'Force Fix All'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search, Filters and Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                {showUnreadOnly ? "Unread Only" : "Show All"}
              </Button>
              
              <div className="flex gap-1">
                <Button
                  variant={timeFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimeFilter("today");
                    setCurrentPage(1);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant={timeFilter === "yesterday" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimeFilter("yesterday");
                    setCurrentPage(1);
                  }}
                >
                  Yesterday
                </Button>
                <Button
                  variant={timeFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimeFilter("week");
                    setCurrentPage(1);
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={timeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTimeFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  All Time
                </Button>
              </div>
              
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setCurrentPage(1);
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationType)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {paginatedNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No notifications found</p>
            </CardContent>
          </Card>
        ) : (
          paginatedNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md cursor-pointer ${!notification.read ? "border-primary/50 bg-primary/5" : ""}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && <Badge variant="default">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              const originalNotif = convexNotifications.find((n: any) => n.id === notification.id);
                              if (originalNotif) markAsRead(notification.id, originalNotif.type);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
