"use client";

import React from 'react';
import { 
  Hash, 
  Play, 
  Download, 
  Trash2, 
  Eye, 
  Copy, 
  Cpu, 
  Loader2, 
  AlertCircle,
  Plus,
  History,
  Save,
  Hand,
  Scissors,
  Eraser,
  Brush,
  Pencil,
  Square,
  Circle,
  Type,
  ArrowUpRight,
  Minus,
  MousePointer,
  CheckCircle2,
  Crown
} from 'lucide-react';

export default function BrandGuidelinesPage() {
  const brandColors = [
    { name: 'Primary Emerald', hex: '#10B981', rgb: '16, 185, 129', description: 'Success, Active, Credits' },
    { name: 'Vivid Purple', hex: '#8B5CF6', rgb: '139, 92, 246', description: 'Upgrade, Premium, Action' },
    { name: 'Electric Blue', hex: '#3B82F6', rgb: '59, 130, 246', description: 'Interactive, Links, Primary' },
    { name: 'Dark Gray', hex: '#1A1A1A', rgb: '26, 26, 26', description: 'Primary Background' },
    { name: 'Medium Gray', hex: '#3D3D3D', rgb: '61, 61, 61', description: 'Borders, Surfaces' },
    { name: 'Light Gray', hex: '#A0A0A0', rgb: '160, 160, 160', description: 'Secondary Text' },
    { name: 'Accent Amber', hex: '#F59E0B', rgb: '245, 158, 11', description: 'Warnings, Highlights' },
    { name: 'Accent Rose', hex: '#F43F5E', rgb: '244, 63, 94', description: 'Danger, Deletion' },
  ];

  const tagStyles = [
    { label: 'Infographic', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    { label: 'Animation', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    { label: 'Dialogue', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    { label: 'Model ID', bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/30' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto border border-gray-800 rounded-3xl overflow-hidden bg-[#111827] shadow-2xl relative">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -z-0" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 blur-[120px] -z-0" />

        {/* Header Section */}
        <div className="p-12 border-b border-gray-800 flex justify-between items-end relative z-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              STORYBOARD STUDIO
            </h1>
            <h2 className="text-4xl font-light tracking-[0.2em] text-gray-400 uppercase">
              Brand Guidelines
            </h2>
          </div>
          <div className="flex flex-col items-end">
             <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                <span className="text-2xl font-bold italic">S</span>
             </div>
             <span className="text-xs font-mono text-gray-500">V1.0 - APRIL 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-12 p-12 relative z-10">
          {/* Left Column: Logo & Typography */}
          <div className="col-span-12 lg:col-span-5 space-y-16">
            
            {/* Company Logo Section */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Company Logo</h3>
              </div>
              <div className="bg-[#1A1A1A] rounded-2xl p-12 flex flex-col items-center justify-center border border-gray-800 group transition-all hover:border-emerald-500/50">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/10">
                    <span className="text-4xl font-black italic transform -skew-x-6">S</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter leading-none">STORYBOARD</span>
                    <span className="text-xl font-light tracking-[0.3em] text-emerald-400 leading-tight">STUDIO</span>
                  </div>
                </div>
                <p className="mt-8 text-[10px] font-mono text-gray-600 uppercase tracking-widest">Primary Logo Lockup / Inverse Style</p>
              </div>
            </section>

            {/* Logo Clearspace */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Logo Clearspace</h3>
              </div>
              <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-dashed border-gray-700 relative flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-4 text-[8px] font-mono text-emerald-500/50">SAFE AREA 'X'</div>
                <div className="p-10 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg" />
                    <div className="w-24 h-4 bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="absolute top-0 bottom-0 left-8 border-l border-emerald-500/20" />
                <div className="absolute top-0 bottom-0 right-8 border-r border-emerald-500/20" />
                <div className="absolute left-0 right-0 top-8 border-t border-emerald-500/20" />
                <div className="absolute left-0 right-0 bottom-8 border-b border-emerald-500/20" />
              </div>
            </section>

            {/* Typography */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Typography</h3>
              </div>
              <div className="space-y-12">
                <div>
                  <div className="flex justify-between items-end border-b border-gray-800 pb-2 mb-4">
                    <span className="text-4xl font-black">Inter</span>
                    <span className="text-xs text-emerald-500 font-bold uppercase">Primary Interface</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                    abcdefghijklmnopqrstuvwxyz<br />
                    0123456789 !@#$%^&*()
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-800 rounded text-[10px] font-bold">BLACK</span>
                    <span className="px-2 py-1 bg-gray-800 rounded text-[10px] font-bold">BOLD</span>
                    <span className="px-2 py-1 bg-gray-800 rounded text-[10px] font-medium">MEDIUM</span>
                    <span className="px-2 py-1 bg-gray-800 rounded text-[10px] font-light">LIGHT</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end border-b border-gray-800 pb-2 mb-4">
                    <span className="text-3xl font-mono">JetBrains Mono</span>
                    <span className="text-xs text-blue-400 font-bold uppercase">System & Code</span>
                  </div>
                  <p className="text-gray-400 font-mono text-sm">
                    const AI_MODEL = 'Nano Banana Pro';
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Colors, Iconography, Buttons */}
          <div className="col-span-12 lg:col-span-7 space-y-16">
            
            {/* Logo Variations */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Logo Variations</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-emerald-600 font-bold italic">S</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">On White</span>
                </div>
                <div className="bg-emerald-500 p-6 rounded-xl flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold italic">S</span>
                  </div>
                  <span className="text-[10px] text-white/70 uppercase tracking-tighter">On Brand</span>
                </div>
                <div className="bg-[#0F172A] p-6 rounded-xl border border-emerald-500/20 flex flex-col items-center gap-4">
                   <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold italic">S</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/70 uppercase tracking-tighter">Icon Primary</span>
                </div>
              </div>
            </section>

            {/* Brand Palette */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Brand Palette</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {brandColors.map((color) => (
                  <div key={color.name} className="flex items-center gap-4 group">
                    <div 
                      className="w-14 h-14 rounded-full border-2 border-white/10 shadow-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-tighter mb-1">{color.name}</h4>
                      <div className="flex flex-col gap-0.5 font-mono text-[9px] text-gray-500">
                        <span>HEX: {color.hex}</span>
                        <span>RGB: {color.rgb}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Iconography Style */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Iconography Style</h3>
              </div>
              <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800">
                <div className="grid grid-cols-6 gap-8 mb-8">
                  <Eye className="w-6 h-6 text-emerald-400" />
                  <Copy className="w-6 h-6 text-emerald-400" />
                  <Trash2 className="w-6 h-6 text-rose-500" />
                  <Play className="w-6 h-6 text-blue-400" />
                  <Download className="w-6 h-6 text-blue-400" />
                  <Cpu className="w-6 h-6 text-purple-400" />
                  <Scissors className="w-6 h-6 text-gray-400" />
                  <Eraser className="w-6 h-6 text-gray-400" />
                  <Brush className="w-6 h-6 text-gray-400" />
                  <Pencil className="w-6 h-6 text-gray-400" />
                  <Square className="w-6 h-6 text-gray-400" />
                  <Type className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest border-t border-gray-800 pt-6">
                  2.0px Weight / Rounded Terminals / Duo-tone Opacity Support
                </p>
              </div>
            </section>

            {/* Button & Tag Styles */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">UI Elements</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <span className="text-[10px] font-mono text-gray-600 block uppercase">Buttons</span>
                  <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0">
                    Manage Plan
                  </button>
                  <button className="w-full py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0">
                    Upgrade Plan
                  </button>
                  <button className="w-full py-3 bg-[#3D3D3D] text-white rounded-xl font-bold text-sm transition-all hover:bg-[#4D4D4D]">
                    Cancel Action
                  </button>
                </div>
                <div className="space-y-6">
                  <span className="text-[10px] font-mono text-gray-600 block uppercase">Tags & Labels</span>
                  <div className="flex flex-wrap gap-2">
                    {tagStyles.map(tag => (
                      <div key={tag.label} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${tag.bg} ${tag.text} ${tag.border}`}>
                        {tag.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500">Build completed successfully</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Accent */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
      </div>
    </div>
  );
}
