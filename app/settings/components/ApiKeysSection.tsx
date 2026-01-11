"use client";

import { SecretKeyInput } from "./SecretKeyInput";

interface ApiKeysSectionProps {
  secretKey: string;
  setSecretKey: (value: string) => void;
  openaiKey: string;
  setOpenaiKey: (value: string) => void;
  openaiSecret: string;
  setOpenaiSecret: (value: string) => void;
}

export function ApiKeysSection({
  secretKey,
  setSecretKey,
  openaiKey,
  setOpenaiKey,
  openaiSecret,
  setOpenaiSecret,
}: ApiKeysSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          API Keys & Secrets
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage your API keys and secrets. These are encrypted and stored securely.
        </p>
        <div className="space-y-4">
          <SecretKeyInput
            label="Secret Key"
            value={secretKey}
            onChange={setSecretKey}
            placeholder="Enter your secret key"
            description="Your application's secret key for authentication"
          />

          <SecretKeyInput
            label="OpenAI API Key"
            value={openaiKey}
            onChange={setOpenaiKey}
            placeholder="sk-..."
            description="Your OpenAI API key for AI features"
          />

          <SecretKeyInput
            label="OpenAI Secret"
            value={openaiSecret}
            onChange={setOpenaiSecret}
            placeholder="Enter OpenAI secret"
            description="Additional OpenAI authentication secret"
          />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Keep your API keys secure. Never share them publicly or commit them to version control.
                These keys provide access to your services and may incur costs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
