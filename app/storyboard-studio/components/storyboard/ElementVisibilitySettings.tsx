"use client";

import { useState, useEffect } from "react";
import { Lock, Users, Globe, Save, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { getCurrentCompanyId } from "@/lib/auth-utils";

interface ElementVisibilitySettingsProps {
  element: any;
  onClose: () => void;
}

export function ElementVisibilitySettings({ element, onClose }: ElementVisibilitySettingsProps) {
  const { user } = useUser();
  const [visibility, setVisibility] = useState(element.visibility || "private");
  const [sharedWith, setSharedWith] = useState(element.sharedWith || []);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const updateVisibility = useMutation(api.elements.updateElementVisibility);
  const companyId = getCurrentCompanyId(user);
  const projects = useQuery(api.projects.listByOrganization, { 
    companyId: companyId 
  });

  useEffect(() => {
    if (projects) {
      setAllProjects(projects.filter(project => project._id !== element.projectId));
    }
  }, [projects, element.projectId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateVisibility({
        elementId: element._id,
        visibility,
        sharedWith: visibility === "shared" ? sharedWith : []
      });
      onClose();
    } catch (error) {
      console.error("Failed to update visibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const sourceColors = {
    private: 'bg-blue-500',
    shared: 'bg-purple-500',
    public: 'bg-emerald-500'
  };

  const sourceIcons = {
    private: Lock,
    shared: Users,
    public: Globe
  };

  const Icon = sourceIcons[visibility as keyof typeof sourceIcons];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${sourceColors[visibility as keyof typeof sourceColors]} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Element Visibility</h3>
              <p className="text-sm text-neutral-400">{element.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Visibility Options */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Visibility Level
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-neutral-700 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <div className="ml-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Private</p>
                    <p className="text-xs text-neutral-400">Only your project can use this element</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-neutral-700 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="radio"
                  name="visibility"
                  value="shared"
                  checked={visibility === "shared"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <div className="ml-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Shared</p>
                    <p className="text-xs text-neutral-400">Share with specific projects</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-3 border border-neutral-700 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <div className="ml-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Public</p>
                    <p className="text-xs text-neutral-400">Anyone can use this element</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Project Selection for Shared */}
          {visibility === "shared" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Share With Projects
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 border border-neutral-700 rounded-lg p-3">
                {allProjects.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No other projects available
                  </p>
                ) : (
                  allProjects.map(project => (
                    <label key={project._id} className="flex items-center gap-2 p-2 hover:bg-neutral-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sharedWith.includes(project._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSharedWith([...sharedWith, project._id]);
                          } else {
                            setSharedWith(sharedWith.filter(id => id !== project._id));
                          }
                        }}
                        className="rounded border-neutral-600 bg-neutral-800 text-indigo-500"
                      />
                      <span className="text-sm text-neutral-300">{project.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Usage Statistics */}
          <div className="bg-neutral-800 rounded-lg p-4 border border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Usage Statistics</span>
              <span className="text-sm text-emerald-300">
                {element.usageCount || 0} uses
              </span>
            </div>
            {element.lastUsedAt && (
              <p className="text-xs text-neutral-400 mt-1">
                Last used: {new Date(element.lastUsedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
