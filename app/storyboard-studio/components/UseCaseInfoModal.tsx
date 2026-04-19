import React from 'react';
import { DarkModal } from './shared/DarkModal';

interface UseCaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  useCaseLabel: string;
  useCaseEmoji: string;
  refMode: 'multi' | 'single' | 'text';
  models: Array<{ value: string; label: string; sub: string }>;
}

// Helper functions for use case descriptions
const getUseCaseDescription = (useCaseLabel: string): string => {
  const descriptions: Record<string, string> = {
    "Character Design": "Creating and modifying characters with multiple reference images for consistent appearance",
    "Clothing & Accessories": "Changing outfits, adding accessories, and modifying clothing while preserving character features",
    "Environment & Products": "Replacing backgrounds, changing product settings, and modifying environmental contexts",
    "Style & Enhancement": "Transferring artistic styles, enhancing textures, and improving image quality and appearance",
    "Composition & Objects": "Rearranging scene elements, changing poses, and adding or removing objects from compositions",
    "Text to Image": "Creating entirely new images from text descriptions without any reference images"
  };
  return descriptions[useCaseLabel] || "Image editing and generation tasks";
};

const getHowToUseInstructions = (useCaseLabel: string, refMode: string): React.ReactElement => {
  const instructions: Record<string, React.ReactElement> = {
    "Character Design": (
      <>
        <div>• Upload 2-3 reference images showing the character from different angles</div>
        <div>• Include images with desired poses, expressions, or styles</div>
        <div>• Write detailed prompt describing the character changes needed</div>
      </>
    ),
    "Clothing & Accessories": (
      <>
        <div>• Upload reference images showing desired clothing or accessories</div>
        <div>• Keep the original character image as the base</div>
        <div>• Describe the clothing changes or accessories to add</div>
      </>
    ),
    "Environment & Products": (
      <>
        <div>• Upload one reference image showing the desired background or style</div>
        <div>• Keep the main subject (person/product) in the original image</div>
        <div>• Describe the background or environment changes needed</div>
      </>
    ),
    "Style & Enhancement": (
      <>
        <div>• Upload reference images showing the desired artistic style</div>
        <div>• Describe the style transfer or enhancement needed</div>
        <div>• Focus on specific areas like color, texture, or mood</div>
      </>
    ),
    "Composition & Objects": (
      <>
        <div>• Upload reference images showing desired composition or object placement</div>
        <div>• Describe the spatial changes or object modifications</div>
        <div>• Include multiple references for complex scene changes</div>
      </>
    ),
    "Text to Image": (
      <>
        <div>• No reference images needed - just use your imagination</div>
        <div>• Write a detailed description of what you want to create</div>
        <div>• Include style, composition, and subject details</div>
      </>
    )
  };
  return instructions[useCaseLabel] || (
    <>
      <div>• Follow the reference mode guidelines</div>
      <div>• Provide clear and detailed instructions</div>
      <div>• Use appropriate reference images if needed</div>
    </>
  );
};

const refModeBadge: Record<'multi' | 'single' | 'text', { label: string; color: string }> = {
  multi:  { label: "📸 Multi-Reference",  color: "bg-green-500/20 text-green-300 border-green-500/30" },
  single: { label: "📸 Single Reference", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  text:   { label: "📝 Text-Only",         color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
};

export default function UseCaseInfoModal({ isOpen, onClose, useCaseLabel, useCaseEmoji, refMode, models }: UseCaseInfoModalProps) {
  if (!isOpen) return null;

  const badge = refModeBadge[refMode];

  return (
    <DarkModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" overlayOpacity={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Use Case Guide</h3>
          </div>
          
          <div className="space-y-4">
            {/* Use Case Header */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">{useCaseEmoji}</div>
              <div>
                <h4 className="text-lg font-semibold text-white">{useCaseLabel}</h4>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                  {badge.label}
                </div>
              </div>
            </div>
            
            {/* Use Case Description */}
            <div className="space-y-3">
              <div className="space-y-2 text-sm text-gray-300">
                <div>
                  <span className="font-medium text-white">Best For:</span> {getUseCaseDescription(useCaseLabel)}
                </div>
                <div>
                  <span className="font-medium text-white">Recommended Models:</span> {models.map(m => m.label).join(", ")}
                </div>
                <div>
                  <span className="font-medium text-white">Reference Mode:</span> {badge.label.replace("📸 ", "").replace("📝 ", "")}
                </div>
              </div>
              
              {/* How to Use */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-white mb-2">How to Use:</div>
                <div className="text-sm text-gray-300 space-y-1">
                  {getHowToUseInstructions(useCaseLabel, refMode)}
                </div>
              </div>
              
              {/* Available Models */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-medium text-white mb-2">Available Models:</div>
                <div className="space-y-2">
                  {models.map((model, idx) => (
                    <div key={model.value} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-white font-medium">{model.label}</div>
                        <div className="text-gray-400 text-xs">{model.sub}</div>
                      </div>
                      {idx === 0 && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Recommended</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
    </DarkModal>
  );
}
