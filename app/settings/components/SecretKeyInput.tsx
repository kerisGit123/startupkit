"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface SecretKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
}

export function SecretKeyInput({
  label,
  value,
  onChange,
  placeholder,
  description,
}: SecretKeyInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const displayValue = isVisible
    ? value
    : value
    ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`
    : "";

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type={isVisible ? "text" : "password"}
          value={isVisible ? value : displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          title={isVisible ? "Hide" : "Show"}
        >
          {isVisible ? (
            <EyeOff size={20} className="text-gray-600" />
          ) : (
            <Eye size={20} className="text-gray-600" />
          )}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isCopied ? "Copied!" : "Copy"}
        >
          {isCopied ? (
            <Check size={20} className="text-green-600" />
          ) : (
            <Copy size={20} className="text-gray-600" />
          )}
        </button>
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
