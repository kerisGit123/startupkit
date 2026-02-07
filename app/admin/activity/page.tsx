"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Activity, Users, LogIn, TrendingUp, Clock, Ban, UserX, Trash2, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivityDashboardPage() {
  const router = useRouter();
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [deletingLogs, setDeletingLogs] = useState(false);
  const [showAllActiveUsers, setShowAllActiveUsers] = useState(false);
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const [loginHistoryPageSize, setLoginHistoryPageSize] = useState(10);
  
  const todaySummary = useQuery(api.activityDashboard.getTodayActivitySummary);
  const usersActiveToday = useQuery(api.activityDashboard.getUsersActiveToday, { limit: 10 });
  const mau = useQuery(api.userActivity.getMonthlyActiveUsers, { daysBack: 30 });
  const loginHistoryData = useQuery(api.activityDashboard.getLoginHistory, { limit: 20 });
  const topActiveUsers = useQuery(api.activityDashboard.getTopActiveUsers, { limit: 20, days: 7 });
  const retentionMetrics = useQuery(api.activityDashboard.getRetentionMetrics);
  
  const toggleUserBlock = useMutation(api.adminUserManagement.toggleUserBlock);
  const deleteActivityLogs = useMutation(api.activityDashboard.deleteActivityLogs);
  
  const loginHistory = loginHistoryData?.logins || [];
  
  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    if (!confirm(`Are you sure you want to ${currentlyBlocked ? 'unblock' : 'block'} this user?`)) {
      return;
    }
    
    setBlockingUserId(userId);
    try {
      await toggleUserBlock({
        userId: userId as any,
        isBlocked: !currentlyBlocked,
        reason: currentlyBlocked ? "Unblocked from activity dashboard" : "Blocked from activity dashboard",
        updatedBy: "admin",
      });
      alert(`User ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      console.error("Error toggling block:", error);
      alert("Failed to update user status");
    } finally {
      setBlockingUserId(null);
    }
  };
  
  const handleDeleteLogs = async (days?: number) => {
    const confirmMsg = days 
      ? `Delete all activity logs older than ${days} days?`
      : "Delete ALL activity logs? This cannot be undone!";
    
    if (!confirm(confirmMsg)) return;
    
    setDeletingLogs(true);
    try {
      const result = await deleteActivityLogs(
        days ? { olderThanDays: days } : { deleteAll: true }
      );
      alert(result.message);
    } catch (error) {
      console.error("Error deleting logs:", error);
      alert("Failed to delete logs");
    } finally {
      setDeletingLogs(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const isLoading = todaySummary === undefined || usersActiveToday === undefined || mau === undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activity Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor user activity and engagement metrics
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/security')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Security & IP Blocking
        </Button>
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800">Loading activity data...</p>
        </div>
      )}
      
      {!isLoading && todaySummary && todaySummary.activeUsers === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-medium">No activity data available</p>
          <p className="text-yellow-700 text-sm mt-1">
            Activity tracking requires user login events. Make sure login tracking is integrated in your authentication flow.
          </p>
        </div>
      )}

      {/* Today's Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySummary?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {usersActiveToday?.count || 0} unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySummary?.logins || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Login events today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySummary?.apiCalls || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              API requests today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Feature Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySummary?.featureUsage || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Feature interactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MAU and Retention Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Active Users (MAU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{mau?.count || 0}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last 30 days</span>
                <span className="font-medium">{mau?.count || 0} users</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active today</span>
                <span className="font-medium">{usersActiveToday?.count || 0} users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="text-lg font-bold">{retentionMetrics?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Last Month</span>
                <span className="text-lg font-bold">{retentionMetrics?.activeLastMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Users (30d)</span>
                <span className="text-lg font-bold">{retentionMetrics?.newUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Retention Rate</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {retentionMetrics?.retentionRate || 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Active Today */}
      <Card>
        <CardHeader>
          <CardTitle>Users Active Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!usersActiveToday?.users || usersActiveToday.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active users today</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {usersActiveToday.users.map((user: { id: string; fullName?: string; email?: string; lastActiveAt?: number; userLabel?: string }) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {user.fullName || "Unknown User"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email || "No email"}
                      </div>
                      {user.userLabel && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.userLabel}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlockUser(user.id, false)}
                      disabled={blockingUserId === user.id}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Active Users (Last 7 Days) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Active Users (Last 7 Days)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllActiveUsers(!showAllActiveUsers)}
            >
              {showAllActiveUsers ? "Show Top 5" : "Show Top 20"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!topActiveUsers || topActiveUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity data available</p>
            ) : (
              topActiveUsers.slice(0, showAllActiveUsers ? 20 : 5).map((item: { userId: string; activityCount: number; user?: { fullName?: string; email?: string } }, index: number) => (
                <div key={item.userId} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {item.user?.fullName || "Unknown User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.user?.email || "No email"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{item.activityCount}</div>
                    <div className="text-xs text-muted-foreground">activities</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBlockUser(item.userId, false)}
                    disabled={blockingUserId === item.userId}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Login History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteLogs(7)}
                disabled={deletingLogs}
                className="text-orange-600 hover:bg-orange-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete 1 Week Old
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteLogs(30)}
                disabled={deletingLogs}
                className="text-orange-600 hover:bg-orange-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete 1 Month Old
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteLogs()}
                disabled={deletingLogs}
                className="text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Time</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">IP Address</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">User Agent</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!loginHistory || loginHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No login history available
                    </td>
                  </tr>
                ) : (
                  loginHistory.slice((loginHistoryPage - 1) * loginHistoryPageSize, loginHistoryPage * loginHistoryPageSize).map((login: { _id: string; userId: string; timestamp: number; ipAddress?: string; userAgent?: string; user?: { fullName?: string; email?: string; userLabel?: string } }) => (
                    <tr key={login._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">
                          {login.user?.fullName || "Unknown"}
                        </div>
                        {login.user?.userLabel && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {login.user.userLabel}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {login.user?.email || "No email"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatTime(login.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono">
                          {login.ipAddress || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {login.userAgent || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlockUser(login.userId, false)}
                          disabled={blockingUserId === login.userId}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          Block
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination for Login History */}
          {loginHistory && loginHistory.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select
                  className="px-3 py-1 border rounded-md text-sm"
                  value={loginHistoryPageSize}
                  onChange={(e) => {
                    setLoginHistoryPageSize(Number(e.target.value));
                    setLoginHistoryPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600 ml-4">
                  Showing {(loginHistoryPage - 1) * loginHistoryPageSize + 1} - {Math.min(loginHistoryPage * loginHistoryPageSize, loginHistory.length)} of {loginHistory.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoginHistoryPage(1)}
                  disabled={loginHistoryPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoginHistoryPage(loginHistoryPage - 1)}
                  disabled={loginHistoryPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  Page {loginHistoryPage} of {Math.ceil(loginHistory.length / loginHistoryPageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoginHistoryPage(loginHistoryPage + 1)}
                  disabled={loginHistoryPage >= Math.ceil(loginHistory.length / loginHistoryPageSize)}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoginHistoryPage(Math.ceil(loginHistory.length / loginHistoryPageSize))}
                  disabled={loginHistoryPage >= Math.ceil(loginHistory.length / loginHistoryPageSize)}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
