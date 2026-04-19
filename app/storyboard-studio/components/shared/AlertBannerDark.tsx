"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const STYLE_MAP: Record<string, string> = {
  error: "bg-red-500/10 border-red-500/30 text-red-300",
  warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
};

const ICON_COLOR: Record<string, string> = {
  error: "text-red-400",
  warning: "text-yellow-400",
  success: "text-emerald-400",
  info: "text-blue-400",
};

export function AlertBannerDark() {
  const { user } = useUser();
  const alerts = useQuery(
    api.alerts.getActiveAlertsForUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const dismissAlert = useMutation(api.alerts.dismissAlert);

  const handleDismiss = async (alertId: string) => {
    if (!user?.id) return;
    await dismissAlert({ alertId: alertId as any, userId: user.id });
  };

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-3">
      {alerts.map((alert) => {
        const Icon = ICON_MAP[alert.type] || Info;
        const style = STYLE_MAP[alert.type] || STYLE_MAP.info;
        const iconColor = ICON_COLOR[alert.type] || ICON_COLOR.info;

        return (
          <div
            key={alert._id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${style}`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
            <span className="font-medium">{alert.title}</span>
            <span className="opacity-70 hidden sm:inline">{alert.message}</span>
            {alert.isDismissible && (
              <button
                onClick={() => handleDismiss(alert._id)}
                className="shrink-0 p-0.5 rounded-full hover:bg-white/10 transition ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
