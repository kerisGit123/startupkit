"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AlertBanner() {
  const { user } = useUser();
  const alerts = useQuery(
    api.alerts.getActiveAlertsForUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const dismissAlert = useMutation(api.alerts.dismissAlert);

  // Debug logging
  console.log("AlertBanner - Current user ID:", user?.id);
  console.log("AlertBanner - Alerts received:", alerts);

  const handleDismiss = async (alertId: string) => {
    if (!user?.id) return;
    await dismissAlert({ alertId: alertId as any, userId: user.id });
  };

  if (!alerts || alerts.length === 0) {
    console.log("AlertBanner - No alerts to display");
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert._id}
          className={`flex items-start gap-3 p-4 border rounded-lg ${getStyles(alert.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(alert.type)}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{alert.title}</h4>
            <p className="text-sm mt-1">{alert.message}</p>
            {alert.expiresAt && (
              <p className="text-xs mt-2 opacity-75">
                Expires: {new Date(alert.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
          {alert.isDismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(alert._id)}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
