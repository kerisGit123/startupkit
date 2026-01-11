"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, Users, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";

export default function AdminAlertsPage() {
  const { user } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "error">("info");
  const [targetType, setTargetType] = useState<"all" | "specific_user" | "role" | "label">("all");
  const [targetValue, setTargetValue] = useState("");
  const [isDismissible, setIsDismissible] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState("");
  const [priority, setPriority] = useState("0");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "info" | "warning" | "success" | "error">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const alerts = useQuery(api.alerts.getAllAlerts);
  const stats = useQuery(api.alerts.getAlertStats);
  const createAlert = useMutation(api.alerts.createAlert);
  const deleteAlert = useMutation(api.alerts.deleteAlert);
  const updateAlert = useMutation(api.alerts.updateAlert);

  const handleCreateAlert = async () => {
    if (!title || !message || !user?.id) {
      alert("Please fill in title and message");
      return;
    }

    try {
      const expiresAt = expiresInDays
        ? Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000
        : undefined;

      await createAlert({
        title,
        message,
        type,
        targetType,
        targetValue: targetValue || undefined,
        createdBy: user.id,
        isDismissible,
        expiresAt,
        priority: parseInt(priority) || 0,
      });

      alert("Alert created successfully!");
      setTitle("");
      setMessage("");
      setTargetValue("");
      setExpiresInDays("");
      setPriority("0");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create alert:", error);
      alert("Failed to create alert");
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      await deleteAlert({ alertId: alertId as any });
      alert("Alert deleted successfully!");
    } catch (error) {
      console.error("Failed to delete alert:", error);
      alert("Failed to delete alert");
    }
  };

  const handleToggleActive = async (alertId: string, currentStatus: boolean) => {
    try {
      await updateAlert({ alertId: alertId as any, isActive: !currentStatus });
    } catch (error) {
      console.error("Failed to update alert:", error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error": return "bg-red-100 text-red-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "success": return "bg-green-100 text-green-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getTargetLabel = (targetType: string, targetValue?: string) => {
    switch (targetType) {
      case "all": return "All Users";
      case "specific_user": return `User: ${targetValue}`;
      case "role": return `Role: ${targetValue}`;
      case "label": return `Label: ${targetValue}`;
      default: return targetType;
    }
  };

  // Filter and search alerts
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((alert) => {
      // Search by title or message
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          alert.title.toLowerCase().includes(query) ||
          alert.message.toLowerCase().includes(query) ||
          alert.creatorName?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filter by type
      if (filterType !== "all" && alert.type !== filterType) {
        return false;
      }

      // Filter by priority
      if (filterPriority !== "all") {
        const priority = alert.priority || 0;
        if (filterPriority === "low" && priority > 3) return false;
        if (filterPriority === "medium" && (priority <= 3 || priority > 7)) return false;
        if (filterPriority === "high" && priority <= 7) return false;
      }

      // Filter by date range
      if (dateFrom) {
        const fromDate = new Date(dateFrom).getTime();
        if (alert.createdAt < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000; // End of day
        if (alert.createdAt > toDate) return false;
      }

      return true;
    });
  }, [alerts, searchQuery, filterType, filterPriority, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterPriority("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  // Paginate filtered alerts
  const totalPages = Math.ceil(filteredAlerts.length / pageSize);
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(startIndex, startIndex + pageSize);
  }, [filteredAlerts, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert & Reminder System</h1>
          <p className="text-muted-foreground mt-2">
            Send alerts and reminders to users across all dashboards
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? "Cancel" : "Create Alert"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAlerts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAlerts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiredAlerts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dismissals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDismissals || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Alert Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Alert title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Alert message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Target</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                >
                  <option value="all">All Users</option>
                  <option value="specific_user">Specific User</option>
                  <option value="role">By Role</option>
                  <option value="label">By Label</option>
                </select>
              </div>
            </div>

            {targetType !== "all" && (
              <div>
                <label className="text-sm font-medium">
                  {targetType === "specific_user" ? "User ID" : targetType === "role" ? "Role Name" : "Label Name"}
                </label>
                <Input
                  placeholder={`Enter ${targetType === "specific_user" ? "user ID" : targetType === "role" ? "role" : "label"}`}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Expires In (Days)</label>
                <Input
                  type="number"
                  placeholder="Leave empty for no expiration"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Priority (0-10)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isDismissible}
                onChange={(e) => setIsDismissible(e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm">Allow users to dismiss this alert</label>
            </div>

            <Button onClick={handleCreateAlert} className="w-full">
              Create Alert
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by title, message, or creator name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low (0-3)</option>
                  <option value="medium">Medium (4-7)</option>
                  <option value="high">High (8-10)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || filterType !== "all" || filterPriority !== "all" || dateFrom || dateTo) && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredAlerts.length} of {alerts?.length || 0} alerts
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {!alerts || alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No alerts created yet
            </p>
          ) : filteredAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No alerts match your filters
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge className={getTypeColor(alert.type)}>{alert.type}</Badge>
                      {alert.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {alert.priority && alert.priority > 0 && (
                        <Badge variant="outline">Priority: {alert.priority}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Target: {getTargetLabel(alert.targetType, alert.targetValue)}</span>
                      <span>By: {alert.creatorName}</span>
                      <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      {alert.expiresAt && (
                        <span>Expires: {new Date(alert.expiresAt).toLocaleDateString()}</span>
                      )}
                      <span>Dismissals: {alert.dismissalCount}</span>
                      <span>{alert.isDismissible ? "Dismissible" : "Persistent"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(alert._id, alert.isActive)}
                    >
                      {alert.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Rows per page:</span>
                  <select
                    className="px-3 py-1 border rounded-md text-sm"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600 ml-4">
                    Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
