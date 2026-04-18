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

/*
 * LTX Style Guide Colors:
 * --bg-primary:       #1A1A1A
 * --bg-secondary:     #2C2C2C
 * --bg-tertiary:      #3D3D3D
 * --text-primary:     #FFFFFF
 * --text-secondary:   #A0A0A0
 * --text-tertiary:    #6E6E6E
 * --border-primary:   #3D3D3D
 * --accent-blue:      #4A90E2 / hover: #357ABD
 * --color-success:    #52C41A
 * --color-warning:    #FAAD14
 * --color-error:      #FF4D4F
 */

const VARIANT_CONFIG = {
  danger: {
    iconBg: "bg-[#FF4D4F]/15",
    iconColor: "text-[#FF4D4F]",
    buttonBg: "bg-[#FF4D4F] hover:bg-[#E04345]",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  warning: {
    iconBg: "bg-[#FAAD14]/15",
    iconColor: "text-[#FAAD14]",
    buttonBg: "bg-[#FAAD14] hover:bg-[#D4940F] text-black",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    iconBg: "bg-[#4A90E2]/15",
    iconColor: "text-[#4A90E2]",
    buttonBg: "bg-[#4A90E2] hover:bg-[#357ABD]",
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
    /* LTX overlay: bg-black/80 with backdrop blur */
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* LTX Modal: bg-primary #1A1A1A, border #3D3D3D, rounded-2xl, dramatic shadow */}
      <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl w-[400px] p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        {/* Header: icon + title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-[15px]">{title}</h3>
            {subtitle && <p className="text-[#6E6E6E] text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Message */}
        <div className="text-[#A0A0A0] text-sm leading-relaxed mb-6">{message}</div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm text-[#A0A0A0] hover:text-white bg-[#2C2C2C] hover:bg-[#3D3D3D] border border-[#3D3D3D] rounded-lg transition font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-sm text-white ${config.buttonBg} rounded-lg transition font-semibold disabled:opacity-50 flex items-center gap-2`}
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
