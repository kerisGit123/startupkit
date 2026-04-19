"use client";

import React, { useState } from "react";
import { Image, Video, FileText, MessageSquare, Tag } from "lucide-react";
import type { Shot } from "../../types";
import { DarkModal } from "../shared/DarkModal";

interface FrameInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeShot: Shot | null;
  onShotsChange: (shots: Shot[]) => void;
  shots: Shot[];
  activeShotId: string;
}

export function FrameInfoDialog({ 
  isOpen, 
  onClose, 
  activeShot,
  onShotsChange,
  shots,
  activeShotId
}: FrameInfoDialogProps) {
  const [activeTab, setActiveTab] = useState<'script' | 'prompts' | 'info'>('script');

  if (!isOpen || !activeShot) return null;

  // Debug: Log activeShot data
  console.log("Frame Info - activeShot data:", {
    activeShotId: activeShot.id,
    imagePrompt: activeShot.imagePrompt,
    videoPrompt: activeShot.videoPrompt,
    description: activeShot.description,
    allKeys: Object.keys(activeShot)
  });

  const tabs = [
    { id: 'script', label: 'Script & Dialogue', icon: MessageSquare },
    { id: 'prompts', label: 'Prompts', icon: FileText },
    { id: 'info', label: 'Additional Info', icon: Tag },
  ] as const;

  return (
    <DarkModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" overlayOpacity={80} noPadding className="bg-[#2C2C2C]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Frame Information</h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Basic Info */}
            <div className="col-span-4 space-y-4">
              <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Title</div>
                <div className="text-white text-sm font-medium">{activeShot.title || 'Untitled'}</div>
              </div>
              
              <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Screen</div>
                <div className="text-2xl font-bold text-white">#{String((activeShot.order || 0) + 1).padStart(2, "0")}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                  <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Duration</div>
                  <div className="text-white text-sm font-medium">{activeShot.duration || 3}s</div>
                </div>
                <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                  <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Aspect</div>
                  <div className="text-white text-sm font-medium">{activeShot.aspectRatio || '16:9'}</div>
                </div>
              </div>
              
              <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Location</div>
                <div className="text-white text-sm font-medium">{activeShot.location || 'Not specified'}</div>
              </div>
              
              <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Camera</div>
                <div className="text-white text-sm font-medium">{activeShot.camera?.length ? activeShot.camera.join(', ') : 'Not specified'}</div>
              </div>
              
              <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-4">
                <div className="text-xs font-medium text-[#6E6E6E] uppercase mb-2">Media</div>
                <div className="text-white text-sm font-medium">
                  {activeShot.imageUrl ? 'Image' : activeShot.videoUrl ? 'Video' : 'None'}
                </div>
              </div>
            </div>
            
            {/* Right Content - Tabbed Interface */}
            <div className="col-span-8">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4 bg-[#1A1A1A] rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#4A90E2] text-white'
                        : 'text-[#A0A0A0] hover:text-white hover:bg-[#3D3D3D]'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl">
                {/* Script & Dialogue Tab */}
                {activeTab === 'script' && (
                  <div className="p-4 space-y-4">
                    {/* Script Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Script & Action</h4>
                      <textarea
                        className="w-full bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg text-white text-sm p-3 resize-none focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20"
                        rows={6}
                        defaultValue={activeShot.bgDescription || activeShot.description || activeShot.action || ''}
                        placeholder="Enter script or action description..."
                        onChange={(e) => {
                          onShotsChange(shots.map(s => 
                            s.id === activeShotId 
                              ? { ...s, action: e.target.value, bgDescription: e.target.value }
                              : s
                          ));
                        }}
                      />
                    </div>
                    
                    {/* Dialogue Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Dialogue</h4>
                      <textarea
                        className="w-full bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg text-white text-sm p-3 resize-none focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20"
                        rows={4}
                        defaultValue={activeShot.voiceOver || ''}
                        placeholder="Enter dialogue or voice-over..."
                        onChange={(e) => {
                          onShotsChange(shots.map(s => 
                            s.id === activeShotId 
                              ? { ...s, voiceOver: e.target.value }
                              : s
                          ));
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Prompts Tab */}
                {activeTab === 'prompts' && (
                  <div className="p-4 space-y-4">
                    {/* Image Prompt Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                        <Image className="w-4 h-4 text-[#4A90E2]" />
                        Image Prompt
                      </h4>
                      <textarea
                        className="w-full bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg text-white text-sm p-3 resize-none focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20"
                        rows={6}
                        defaultValue={activeShot.imagePrompt || ''}
                        placeholder="Enter image generation prompt..."
                        onChange={(e) => {
                          onShotsChange(shots.map(s => 
                            s.id === activeShotId 
                              ? { ...s, imagePrompt: e.target.value }
                              : s
                          ));
                        }}
                      />
                    </div>
                    
                    {/* Video Prompt Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                        <Video className="w-4 h-4 text-[#4A9E8E]" />
                        Video Prompt
                      </h4>
                      <textarea
                        className="w-full bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg text-white text-sm p-3 resize-none focus:outline-none focus:border-[#4A9E8E] focus:ring-2 focus:ring-[#4A9E8E]/20"
                        rows={6}
                        defaultValue={activeShot.videoPrompt || ''}
                        placeholder="Enter video generation prompt..."
                        onChange={(e) => {
                          onShotsChange(shots.map(s => 
                            s.id === activeShotId 
                              ? { ...s, videoPrompt: e.target.value }
                              : s
                          ));
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Additional Info Tab */}
                {activeTab === 'info' && (
                  <div className="p-4 space-y-4">
                    {/* Tags Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {activeShot.tags?.length > 0 ? (
                          activeShot.tags.map(tag => (
                            <span key={tag.id} className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: tag.color + "cc" }}>
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#6E6E6E] text-xs">No tags</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Notes Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">Notes</h4>
                      <textarea
                        className="w-full bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg text-white text-sm p-3 resize-none focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20"
                        rows={6}
                        defaultValue={activeShot.notes || ''}
                        placeholder="Add notes..."
                        onChange={(e) => {
                          onShotsChange(shots.map(s => 
                            s.id === activeShotId 
                              ? { ...s, notes: e.target.value }
                              : s
                          ));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </DarkModal>
  );
}
