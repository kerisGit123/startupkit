"use client";

import { AlertTriangle, CheckCircle, Clock, MapPin, User } from "lucide-react";

interface ConsistencyIssue {
  type: "character" | "location" | "timeline";
  severity: "error" | "warning" | "info";
  message: string;
  panel: string;
}

interface ConsistencyCheckerProps {
  panels: any[];
  characters: any[];
  locations: any[];
}

export function ConsistencyChecker({ panels, characters, locations }: ConsistencyCheckerProps) {
  const checkConsistency = (): ConsistencyIssue[] => {
    const issues: ConsistencyIssue[] = [];

    // Character appearance validation
    const characterAppearances = new Map<string, string[]>();
    panels.forEach((panel, index) => {
      panel.characters?.forEach((charId: string) => {
        if (!characterAppearances.has(charId)) {
          characterAppearances.set(charId, []);
        }
        characterAppearances.get(charId)?.push(`Panel ${index + 1}`);
      });
    });

    // Check for character consistency
    characterAppearances.forEach((appearances, charId) => {
      const char = characters.find(c => c.id === charId);
      if (appearances.length > 5) {
        issues.push({
          type: "character",
          severity: "warning",
          message: `${char?.name || charId} appears in ${appearances.length} panels - ensure consistent design`,
          panel: appearances[0]
        });
      }
    });

    // Location continuity check
    let lastLocation = "";
    panels.forEach((panel, index) => {
      if (panel.location && panel.location !== lastLocation && lastLocation !== "") {
        const suddenChange = index > 0 && !panels[index - 1].stageDirection?.toLowerCase().includes("move");
        if (suddenChange) {
          issues.push({
            type: "location",
            severity: "warning",
            message: `Sudden location change from ${lastLocation} to ${panel.location} without transition`,
            panel: `Panel ${index + 1}`
          });
        }
      }
      if (panel.location) lastLocation = panel.location;
    });

    // Timeline verification
    const times = panels.map(p => p.time).filter(Boolean);
    if (times.length > 1) {
      const timeOrder = ["dawn", "morning", "afternoon", "evening", "night"];
      for (let i = 1; i < times.length; i++) {
        const prevIndex = timeOrder.indexOf(times[i - 1]);
        const currIndex = timeOrder.indexOf(times[i]);
        if (prevIndex > currIndex && currIndex !== -1) {
          issues.push({
            type: "timeline",
            severity: "error",
            message: `Time inconsistency: ${times[i - 1]} followed by ${times[i]}`,
            panel: `Panel ${i + 1}`
          });
        }
      }
    }

    // Add success message if no issues
    if (issues.length === 0) {
      issues.push({
        type: "character",
        severity: "info",
        message: "All consistency checks passed!",
        panel: "All panels"
      });
    }

    return issues;
  };

  const issues = checkConsistency();

  const severityConfig = {
    error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
    warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    info: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  };

  const typeIcons = {
    character: User,
    location: MapPin,
    timeline: Clock,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Consistency Checker</h3>
        </div>
        <span className="text-xs text-gray-400">
          {issues.filter(i => i.severity !== "info").length} issues found
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {issues.map((issue, index) => {
          const config = severityConfig[issue.severity];
          const Icon = config.icon;
          const TypeIcon = typeIcons[issue.type];

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${config.bg} ${config.border}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeIcon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-xs font-semibold text-white uppercase tracking-wide">
                      {issue.type}
                    </span>
                    <span className="text-xs text-gray-400">• {issue.panel}</span>
                  </div>
                  <div className={`text-sm ${config.color}`}>{issue.message}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Errors</div>
          <div className="text-lg font-bold text-red-400">
            {issues.filter(i => i.severity === "error").length}
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Warnings</div>
          <div className="text-lg font-bold text-yellow-400">
            {issues.filter(i => i.severity === "warning").length}
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Passed</div>
          <div className="text-lg font-bold text-green-400">
            {issues.filter(i => i.severity === "info").length}
          </div>
        </div>
      </div>
    </div>
  );
}
