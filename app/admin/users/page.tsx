"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users as UsersIcon, Search, Mail, Calendar, CreditCard, Tag, Activity, Bell, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserLabelBadge, USER_LABELS } from "./components/UserLabelBadge";

export default function UsersPage() {
  const users = useQuery(api.adminUsers.getAllUsers);
  const stats = useQuery(api.adminUsers.getUserStats);
  const userStats = useQuery(api.adminUserManagement.getUserStatistics);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [labelFilter, setLabelFilter] = useState("");
  const [alertDialog, setAlertDialog] = useState<{ userId: string; userName: string; userEmail: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  
  const updateUserLabel = useMutation(api.adminUserManagement.updateUserLabel);
  const toggleUserBlock = useMutation(api.adminUserManagement.toggleUserBlock);
  const createAlert = useMutation(api.alerts.createAlert);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const userDate = new Date(user._creationTime);
      const matchesStartDate = !startDate || userDate >= new Date(startDate);
      const matchesEndDate = !endDate || userDate <= new Date(endDate + "T23:59:59");
      const matchesDate = matchesStartDate && matchesEndDate;
      
      const matchesLabel = !labelFilter || user.userLabel === labelFilter;
      const matchesStatus = !statusFilter || 
        (statusFilter === "blocked" && user.isBlocked) ||
        (statusFilter === "active" && !user.isBlocked);
      
      return matchesSearch && matchesDate && matchesLabel && matchesStatus;
    });
  }, [users, searchTerm, startDate, endDate, labelFilter, statusFilter]);
  
  const handleLabelChange = async (userId: any, newLabel: string) => {
    try {
      await updateUserLabel({
        userId,
        userLabel: newLabel,
        updatedBy: "admin",
      });
    } catch (error) {
      console.error("Error updating label:", error);
      alert("Failed to update user label");
    }
  };
  
  const openAlertDialog = (userId: string, userName: string, userEmail: string) => {
    setAlertDialog({ userId, userName, userEmail });
    setAlertMessage("");
  };

  const sendAlertToUser = async () => {
    if (!alertDialog || !alertMessage.trim()) {
      alert("Please enter a message");
      return;
    }
    
    setSendingAlert(alertDialog.userId);
    try {
      await createAlert({
        title: "Message from Admin",
        message: alertMessage,
        type: "info",
        targetType: "specific_user",
        targetValue: alertDialog.userId,
        priority: 5,
        isDismissible: true,
        createdBy: "admin",
      });
      
      alert(`Alert sent to ${alertDialog.userName}!\n\nThe message will appear in their alerts page.`);
      setAlertDialog(null);
      setAlertMessage("");
    } catch (error) {
      console.error("Failed to send alert:", error);
      alert("Failed to send alert");
    } finally {
      setSendingAlert(null);
    }
  };

  const handleBlockUser = async (userId: string, isCurrentlyBlocked: boolean) => {
    if (!confirm(`Are you sure you want to ${isCurrentlyBlocked ? 'unblock' : 'block'} this user?`)) return;
    try {
      await toggleUserBlock({
        userId,
        isBlocked: !isCurrentlyBlocked,
        reason: isCurrentlyBlocked ? "Unblocked by admin" : "Blocked by admin",
        updatedBy: "admin",
      });
    } catch (error) {
      console.error("Error toggling block:", error);
      alert("Failed to update user status");
    }
  };

  const getStatusBadge = (hasSubscription: boolean) => {
    if (hasSubscription) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Subscribed</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600">Free</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage all users in the system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.freeUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.activeLastMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          placeholder="Start date"
          className="w-40"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          placeholder="End date"
          className="w-40"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Labels</option>
          {USER_LABELS.map((label) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-9 w-40 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Clean Table - Image 4 Style */}
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="px-6 py-3 text-sm font-medium text-gray-600">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">User</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Email</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Label</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Last Login</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!filteredUsers ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No users found</td></tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {user.fullName || "Unknown User"}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {user._id.substring(0, 10)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.email || "No email"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.userLabel || ""}
                        onChange={(e) => handleLabelChange(user._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="">No Label</option>
                        {USER_LABELS.map((label) => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
                      {user.userLabel && <UserLabelBadge label={user.userLabel} />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Blocked</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openAlertDialog(user.clerkUserId || user._id, user.fullName || "User", user.email || "")}
                        disabled={sendingAlert === (user.clerkUserId || user._id)}
                        className="flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        Alert
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBlockUser(user._id, user.isBlocked || false)}
                        className={user.isBlocked ? "" : "text-destructive hover:bg-destructive/10"}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-between text-sm text-gray-600">
          <div>0 of {filteredUsers?.length || 0} row(s) selected.</div>
          <div className="flex items-center gap-4">
            <span>Rows per page: 10</span>
            <span>Page 1 of {Math.ceil((filteredUsers?.length || 0) / 10)}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>«</Button>
              <Button variant="outline" size="sm" disabled>‹</Button>
              <Button variant="outline" size="sm">›</Button>
              <Button variant="outline" size="sm">»</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog */}
      {alertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Send Alert to {alertDialog.userName}</h3>
              <button
                onClick={() => setAlertDialog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Recipient: {alertDialog.userEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Message</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full border rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setAlertDialog(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={sendAlertToUser}
                disabled={!alertMessage.trim() || !!sendingAlert}
                className="flex-1"
              >
                {sendingAlert ? "Sending..." : "Send Alert"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
