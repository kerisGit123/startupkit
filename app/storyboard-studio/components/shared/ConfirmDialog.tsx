"use client";

import React from "react";

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when user cancels or closes */
  onCancel: () => void;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Dialog title */
  title?: string;
  /** Subtitle below the title */
  subtitle?: string;
  /** Main message body */
  message: React.ReactNode;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant controls icon and button color */
  variant?: "danger" | "warning" | "info";
  /** Whether confirm action is in progress */
  loading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    buttonBg: "bg-red-500 hover:bg-red-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  warning: {
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    buttonBg: "bg-amber-500 hover:bg-amber-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    buttonBg: "bg-blue-500 hover:bg-blue-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title = "Confirm",
  subtitle,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = VARIANT_CONFIG[variant];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60">
      <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl w-[380px] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="text-gray-300 text-sm mb-5">{message}</div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white ${config.buttonBg} rounded-lg transition font-medium disabled:opacity-50 flex items-center gap-2`}
          >
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
