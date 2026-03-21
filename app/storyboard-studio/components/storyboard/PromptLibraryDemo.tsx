"use client";

import { useState } from 'react';
import PromptLibrary from './PromptLibrary';

export default function PromptLibraryDemo() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Prompt Library Demo</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Selected Prompt</h2>
          <div className="bg-gray-100 rounded-lg p-4 min-h-[100px]">
            {selectedPrompt ? (
              <p className="text-gray-800">{selectedPrompt}</p>
            ) : (
              <p className="text-gray-500 italic">No prompt selected. Click "Open Prompt Library" to choose one.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Open Prompt Library
            </button>
            {selectedPrompt && (
              <button
                onClick={() => setSelectedPrompt('')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Prompt
              </button>
            )}
          </div>
        </div>

        <PromptLibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelectPrompt={(prompt) => {
            setSelectedPrompt(prompt);
            setIsLibraryOpen(false);
          }}
          userCompanyId="demo-company-id"
        />
      </div>
    </div>
  );
}
