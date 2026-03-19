"use client";

import { useState } from "react";
import { BuildStoryboardDialog } from "./BuildStoryboardDialog";
import { StoryboardCard } from "./StoryboardCard";
import { Button } from "@/components/ui/button";

export function BuildDemoPage() {
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  
  // Mock storyboard data for demo
  const mockProjectId = "demo-project-123"; // Changed from storyboardId to projectId
  const mockTitle = "The Sea Eater";
  const mockDescription = "An animated adventure story about a mysterious sea creature";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Storyboard Build System Demo
          </h1>
          <p className="text-lg text-gray-600">
            Experience the new AI-powered storyboard build system with real-time status updates
          </p>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StoryboardCard
            projectId={mockProjectId} // Changed from storyboardId to projectId
            title={mockTitle}
            description={mockDescription}
          />
          
          <StoryboardCard
            projectId="demo-project-456" // Changed from storyboardId to projectId
            title="Space Adventure"
            description="A sci-fi journey through the cosmos"
          />
        </div>

        {/* Build Dialog Trigger */}
        <div className="text-center">
          <Button
            onClick={() => setShowBuildDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-medium"
          >
            Open Build Dialog
          </Button>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-emerald-600">✅ Non-Blocking Architecture</h3>
              <p className="text-sm text-gray-600">
                System returns immediately, processes in background
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-emerald-600">✅ Real-Time Updates</h3>
              <p className="text-sm text-gray-600">
                Live status updates via Convex subscriptions
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-emerald-600">✅ AI-Powered Extraction</h3>
              <p className="text-sm text-gray-600">
                n8n workflow extracts elements and scenes automatically
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-emerald-600">✅ Multiple Build Strategies</h3>
              <p className="text-sm text-gray-600">
                Choose between normal, enhanced, preserve, or regenerate options
              </p>
            </div>
          </div>
        </div>

        {/* Build Dialog */}
        <BuildStoryboardDialog
          open={showBuildDialog}
          onOpenChange={setShowBuildDialog}
          projectId={mockProjectId} // Changed from storyboardId to projectId
          onSuccess={() => {
            console.log("Build started successfully!");
          }}
        />
      </div>
    </div>
  );
}
