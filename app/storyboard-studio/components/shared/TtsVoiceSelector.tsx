"use client";

import React, { useState, useRef } from "react";
import { Mic, ChevronDown, Search, Play, Pause, Check, Globe } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────
export interface TtsVoice {
  id: string;
  name: string;
  desc?: string;
}

export interface TtsVoiceGroup {
  label: string;
  voices: TtsVoice[];
}

// ── Voice Data ───────────────────────────────────────────────────────
// Previewable voices first (hash IDs have audio at static.aiquickdraw.com)
// Standard voices last (name-only IDs, no preview available)
export const TTS_VOICE_GROUPS: TtsVoiceGroup[] = [
  { label: "Narrators & Announcers", voices: [
    { id: "EkK5I93UQWFDigLMpZcX", name: "James", desc: "Husky, Engaging and Bold" },
    { id: "8JVbfL6oEdmuxKn5DK2C", name: "Johnny Kid", desc: "Serious and Calm Narrator" },
    { id: "6F5Zhi321D3Oq7v1oNT4", name: "Hank", desc: "Deep and Engaging Narrator" },
    { id: "DYkrAHD8iwork3YSUBbs", name: "Tom", desc: "Conversations & Books" },
    { id: "x70vRnQBMBu4FAYhjJbO", name: "Nathan", desc: "Virtual Radio Host" },
    { id: "dHd5gvgSOzSfduK4CvEg", name: "Ed", desc: "Late Night Announcer" },
    { id: "LG95yZDEHg6fCZdQjLqj", name: "Phil", desc: "Explosive, Passionate Announcer" },
    { id: "gU0LNdkMOQCOrPrwtbee", name: "British Football Announcer" },
    { id: "CeNX9CMwmxDxUF5Q2Inm", name: "Johnny Dynamite", desc: "Vintage Radio DJ" },
    { id: "aD6riP1btT197c6dACmy", name: "Rachel M", desc: "Pro British Radio Presenter" },
  ]},
  { label: "Conversational & Friendly", voices: [
    { id: "1SM7GgM6IMuvQlz2BwM3", name: "Mark", desc: "Casual, Relaxed and Light" },
    { id: "UgBBYS2sOqTuMpoF3BR0", name: "Mark", desc: "Natural Conversations" },
    { id: "5l5f8iK3YPeGga21rQIX", name: "Adeline", desc: "Feminine and Conversational" },
    { id: "hpp4J3VqNfWAUOO0d1Us", name: "Bella", desc: "Professional, Bright, Warm" },
    { id: "Sm1seazb4gs7RSlUVw7c", name: "Anika", desc: "Animated, Friendly and Engaging" },
    { id: "g6xIsTj2HwM6VR4iXFCw", name: "Jessica A.B.", desc: "Chatty and Friendly" },
    { id: "lcMyyd2HUfFzxdCaC4Ta", name: "Lucy", desc: "Fresh & Casual" },
    { id: "6aDn1KB0hjpdcocrUkmq", name: "Tiffany", desc: "Natural and Welcoming" },
    { id: "scOwDtmlUjD3prqpp97I", name: "Sam", desc: "Support Agent" },
    { id: "DTKMou8ccj1ZaWGBiotd", name: "Jamahal", desc: "Young, Vibrant, Natural" },
  ]},
  { label: "Social Media & Content", voices: [
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", desc: "Energetic, Social Media Creator" },
    { id: "kPzsL2i3teMYv0FxEYQ6", name: "Brittney", desc: "Fun, Youthful & Informative" },
    { id: "BZgkqPqms7Kj9ulSkVzn", name: "Eve", desc: "Authentic, Energetic and Happy" },
    { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", desc: "Enthusiast, Quirky Attitude" },
    { id: "uYXf8XasLslADfZ2MB4u", name: "Hope", desc: "Bubbly, Gossipy and Girly" },
    { id: "pPdl9cQBQq4p6mRkZy2Z", name: "Emma", desc: "Adorable and Upbeat" },
    { id: "vBKc2FfBKJfcZNyEt1n6", name: "Finn", desc: "Youthful, Eager and Energetic" },
  ]},
  { label: "Deep & Commanding", voices: [
    { id: "nPczCjzI2devNBz1zQrb", name: "Brian", desc: "Deep, Resonant and Comforting" },
    { id: "gs0tAILXbY5DNrJrsM6F", name: "Jeff", desc: "Classy, Resonating and Strong" },
    { id: "YOq2y2Up4RgXP2HyXjE5", name: "Xavier", desc: "Dominating, Metallic Announcer" },
    { id: "DGzg6RaUqxGRTHSBjfgF", name: "Brock", desc: "Commanding, Loud Sergeant" },
    { id: "EiNlNiXeDU1pqqOPrYMO", name: "John Doe", desc: "Deep" },
    { id: "mtrellq69YZsNwzUSyXh", name: "Rex Thunder", desc: "Deep N Tough" },
    { id: "4YYIPFl9wE5c4L2eu2Gb", name: "Burt Reynolds", desc: "Deep, Smooth and Clear" },
    { id: "zYcjlYFOd3taleS0gkk3", name: "Edward", desc: "Loud, Confident and Cocky" },
  ]},
  { label: "Calm & Soothing", voices: [
    { id: "P1bg08DkjqiVEzOn76yG", name: "Viraj", desc: "Rich and Soft" },
    { id: "1U02n4nD6AdIZ9CjF053", name: "Viraj", desc: "Smooth and Gentle" },
    { id: "qDuRKMlYmrm8trt5QyBn", name: "Taksh", desc: "Calm, Serious and Smooth" },
    { id: "LruHrtVF6PSyGItzMNHS", name: "Benjamin", desc: "Deep, Warm, Calming" },
    { id: "1wGbFxmAM3Fgw63G1zZJ", name: "Allison", desc: "Calm, Soothing, Meditative" },
    { id: "hqfrgApggtO1785R4Fsn", name: "Theodore HQ", desc: "Serene and Grounded" },
    { id: "MJ0RnG71ty4LH3dvNfSd", name: "Leon", desc: "Soothing and Grounded" },
    { id: "AeRdCCKzvd23BpJoofzx", name: "Nathaniel", desc: "Engaging, British and Calm" },
  ]},
  { label: "Character & Creative", voices: [
    { id: "Z3R5wn05IrDiVCyEkUrK", name: "Arabella", desc: "Mysterious and Emotive" },
    { id: "NNl6r8mD7vthiJatiJt1", name: "Bradford", desc: "Expressive and Articulate" },
    { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", desc: "Husky Trickster" },
    { id: "qXpMhyvQqiRxWQs4qSSB", name: "Horatius", desc: "Energetic Character Voice" },
    { id: "NOpBlnGInO9m6vDvFkFC", name: "Spuds Oxley", desc: "Wise and Approachable" },
    { id: "nzeAacJi50IvxcyDnMXa", name: "Marshal", desc: "Friendly, Funny Professor" },
    { id: "9yzdeviXkFddZ4Oz8Mok", name: "Lutz", desc: "Chuckling, Giggly, Cheerful" },
    { id: "B8gJV1IhpuegLxdpXFOE", name: "Kuon", desc: "Cheerful, Clear and Steady" },
    { id: "Tsns2HvNFKfGiNjllgqo", name: "Sven", desc: "Emotional and Nice" },
    { id: "ljo9gAlSqKOvF6D8sOsX", name: "Viking Bjorn", desc: "Epic Medieval Raider" },
    { id: "PPzYpIqttlTYA83688JI", name: "Pirate Marshal" },
    { id: "YXpFCvM1S3JbWEJhoskW", name: "Wyatt", desc: "Wise Rustic Cowboy" },
    { id: "ruirxsoakN0GWmGNIo04", name: "John Morgan", desc: "Gritty, Rugged Cowboy" },
    { id: "D2jw4N9m4xePLTQ3IHjU", name: "Ian", desc: "Strange, Distorted Alien" },
  ]},
  { label: "Villains & Dramatic", voices: [
    { id: "TC0Zp7WVFzhA8zpTlRqV", name: "Aria", desc: "Sultry Villain" },
    { id: "flHkNRp1BlvT73UL6gyz", name: "Jessica A.B.", desc: "Eloquent Villain" },
    { id: "esy0r39YPLQjOczyOib8", name: "Britney", desc: "Calm, Calculative Villain" },
    { id: "eVItLK1UvXctxuaRV2Oq", name: "Jean", desc: "Alluring, Playful Femme Fatale" },
    { id: "iCrDUkL56s3C8sCRl7wb", name: "Hope", desc: "Poetic, Romantic, Captivating" },
    { id: "wJqPPQ618aTW29mptyoc", name: "Ana Rita", desc: "Smooth, Expressive and Bright" },
  ]},
  { label: "International & Accent", voices: [
    { id: "2zRM7PkgwBPiau2jvVXc", name: "Monika Sogam", desc: "Deep and Natural" },
    { id: "wo6udizrrtpIxWGp2qJk", name: "Northern Terry" },
    { id: "eR40ATw9ArzDf9h3v7t7", name: "Addison 2.0", desc: "Australian Audiobook & Podcast" },
    { id: "Sq93GQT4X1lKDXsQcixO", name: "Felix", desc: "Warm, Positive, Contemporary RP" },
    { id: "56AoDkrOh6qfVPDXZ7Pt", name: "Cassidy", desc: "Crisp, Direct and Clear" },
  ]},
  { label: "Standard Voices", voices: [
    { id: "Rachel", name: "Rachel" }, { id: "Aria", name: "Aria" }, { id: "Roger", name: "Roger" }, { id: "Sarah", name: "Sarah" }, { id: "Laura", name: "Laura" },
    { id: "Charlie", name: "Charlie" }, { id: "George", name: "George" }, { id: "Callum", name: "Callum" }, { id: "River", name: "River" }, { id: "Liam", name: "Liam" },
    { id: "Charlotte", name: "Charlotte" }, { id: "Alice", name: "Alice" }, { id: "Matilda", name: "Matilda" }, { id: "Will", name: "Will" }, { id: "Jessica", name: "Jessica" },
    { id: "Eric", name: "Eric" }, { id: "Chris", name: "Chris" }, { id: "Brian", name: "Brian" }, { id: "Daniel", name: "Daniel" }, { id: "Lily", name: "Lily" }, { id: "Bill", name: "Bill" },
  ]},
];

// ── Helpers ──────────────────────────────────────────────────────────

const TTS_ALL_VOICES: TtsVoice[] = TTS_VOICE_GROUPS.flatMap(g => g.voices);

/** Default voice ID (James — previewable) */
export const TTS_DEFAULT_VOICE = "EkK5I93UQWFDigLMpZcX";

/** Full label: "James - Husky, Engaging and Bold" */
export function getTtsVoiceLabel(id: string): string {
  const v = TTS_ALL_VOICES.find(v => v.id === id);
  if (!v) return id;
  return v.desc ? `${v.name} - ${v.desc}` : v.name;
}

/** Short name: "James" */
export function getTtsVoiceName(id: string): string {
  return TTS_ALL_VOICES.find(v => v.id === id)?.name || id;
}

/** Whether this voice ID has a preview audio file */
export function hasTtsPreview(voiceId: string): boolean {
  return voiceId.length > 15;
}

/** Preview audio URL */
export function getTtsPreviewUrl(voiceId: string): string {
  return `https://static.aiquickdraw.com/elevenlabs/voice/${voiceId}.mp3`;
}

// ── Component ────────────────────────────────────────────────────────

interface TtsVoiceSelectorProps {
  value: string;
  onChange: (voiceId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Compact inline mode for toolbar bars — no label, minimal styling */
  inline?: boolean;
}

export function TtsVoiceSelector({ value, onChange, open, onOpenChange, inline }: TtsVoiceSelectorProps) {
  const [search, setSearch] = useState("");
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const q = search.toLowerCase();

  return (
    <div className={inline ? "relative" : ""}>
      {!inline && <label className="text-[10px] text-gray-500 mb-1 block">Voice</label>}
      <audio ref={audioRef} style={{ display: "none" }} preload="none" onEnded={() => setPreviewPlaying(null)} />
      <div className="relative">
        {/* Selected voice button */}
        <button
          onClick={() => { onOpenChange(!open); setSearch(""); }}
          className={inline
            ? "flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer max-w-[220px]"
            : "w-full px-2.5 py-1.5 bg-[#0A0A0F] border border-[#2A2A32] rounded-md text-[12px] text-[#EAEAEA] flex items-center justify-between cursor-pointer hover:border-[#4A4A4A] transition"
          }
        >
          <div className="flex items-center gap-1.5 truncate">
            <Mic className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="truncate">{inline ? getTtsVoiceLabel(value) : getTtsVoiceLabel(value)}</span>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0 ml-1" />
        </button>

        {/* Dropdown */}
        {open && inline && <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} />}
        {open && (
          <div className={`absolute ${inline ? "bottom-full left-0 mb-2" : "top-full left-0 mt-1"} w-[280px] bg-[#0A0A0F] border border-[#2A2A32] rounded-lg shadow-xl z-50 max-h-[320px] overflow-hidden flex flex-col`}>
            {/* Search */}
            <div className="p-1.5 border-b border-[#2A2A32]">
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#141418] rounded-md">
                <Search className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search voices..."
                  autoFocus
                  className="flex-1 bg-transparent text-[11px] text-[#EAEAEA] placeholder-gray-600 outline-none"
                />
              </div>
            </div>

            {/* Voice list */}
            <div className="overflow-y-auto flex-1 py-1">
              {TTS_VOICE_GROUPS.map((group) => {
                const filtered = group.voices.filter(v =>
                  v.name.toLowerCase().includes(q) ||
                  (v.desc && v.desc.toLowerCase().includes(q)) ||
                  v.id.toLowerCase().includes(q)
                );
                if (filtered.length === 0) return null;
                return (
                  <div key={group.label}>
                    <div className="px-3 pt-2 pb-1 text-[9px] text-gray-600 font-medium uppercase tracking-wider">
                      {group.label}
                    </div>
                    {filtered.map((v) => {
                      const canPreview = hasTtsPreview(v.id);
                      return (
                        <div
                          key={v.id}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors ${
                            value === v.id ? "bg-blue-500/10" : "hover:bg-[#1E1E24]"
                          }`}
                        >
                          {/* Play preview or initial */}
                          {canPreview ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const audio = audioRef.current;
                                if (!audio) return;
                                if (previewPlaying === v.id) {
                                  audio.pause();
                                  setPreviewPlaying(null);
                                } else {
                                  audio.src = getTtsPreviewUrl(v.id);
                                  audio.play().catch(() => {});
                                  setPreviewPlaying(v.id);
                                }
                              }}
                              className="w-7 h-7 rounded-full bg-[#1E1E24] border border-[#2A2A32] hover:border-blue-500/40 hover:bg-blue-500/10 flex items-center justify-center flex-shrink-0 transition"
                              title={`Preview ${v.name}`}
                            >
                              {previewPlaying === v.id ? (
                                <Pause className="w-3 h-3 text-blue-400" />
                              ) : (
                                <Play className="w-3 h-3 text-gray-400 ml-0.5" />
                              )}
                            </button>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#1E1E24] border border-[#2A2A32] flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] text-gray-500 font-medium">
                                {v.name.charAt(0)}
                              </span>
                            </div>
                          )}

                          {/* Voice info + select */}
                          <button
                            onClick={() => {
                              onChange(v.id);
                              if (audioRef.current) {
                                audioRef.current.pause();
                                setPreviewPlaying(null);
                              }
                              onOpenChange(false);
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div
                              className={`text-[11px] font-medium truncate ${
                                value === v.id ? "text-blue-400" : "text-[#EAEAEA]"
                              }`}
                            >
                              {v.name}
                            </div>
                            {v.desc && (
                              <div className="text-[9px] text-gray-600 truncate">
                                {v.desc}
                              </div>
                            )}
                          </button>

                          {/* Selected checkmark */}
                          {value === v.id && (
                            <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Language Data ────────────────────────────────────────────────────

export interface TtsLanguage {
  code: string;
  name: string;
}

export const TTS_LANGUAGES: TtsLanguage[] = [
  { code: "", name: "Auto-detect" },
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "es", name: "Spanish" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
  { code: "pt", name: "Portuguese" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "el", name: "Greek" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "uk", name: "Ukrainian" },
  { code: "ms", name: "Malay" },
  { code: "ta", name: "Tamil" },
  { code: "bn", name: "Bengali" },
  { code: "he", name: "Hebrew" },
  { code: "fil", name: "Filipino" },
  { code: "sk", name: "Slovak" },
  { code: "hr", name: "Croatian" },
  { code: "bg", name: "Bulgarian" },
];

export function getTtsLanguageName(code: string): string {
  if (!code) return "Auto-detect";
  return TTS_LANGUAGES.find(l => l.code === code)?.name || code;
}

// ── Language Selector Component ──────────────────────────────────────

interface TtsLanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TtsLanguageSelector({ value, onChange, open, onOpenChange }: TtsLanguageSelectorProps) {
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();

  const filtered = TTS_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
  );

  return (
    <div>
      <label className="text-[10px] text-gray-500 mb-1 block">Language</label>
      <div className="relative">
        <button
          onClick={() => { onOpenChange(!open); setSearch(""); }}
          className="w-full px-2.5 py-1.5 bg-[#0A0A0F] border border-[#2A2A32] rounded-md text-[12px] text-[#EAEAEA] flex items-center justify-between cursor-pointer hover:border-[#4A4A4A] transition"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Globe className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <span className="truncate">
              {value ? `${getTtsLanguageName(value)} (${value})` : "Auto-detect"}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-full bg-[#0A0A0F] border border-[#2A2A32] rounded-lg shadow-xl z-50 max-h-[240px] overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-1.5 border-b border-[#2A2A32]">
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#141418] rounded-md">
                <Search className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search language..."
                  autoFocus
                  className="flex-1 bg-transparent text-[11px] text-[#EAEAEA] placeholder-gray-600 outline-none"
                />
              </div>
            </div>

            {/* Language list */}
            <div className="overflow-y-auto flex-1 py-1">
              {filtered.map((lang) => (
                <button
                  key={lang.code || "_auto"}
                  onClick={() => { onChange(lang.code); onOpenChange(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] transition-colors ${
                    value === lang.code ? "bg-teal-500/10 text-teal-400" : "text-[#EAEAEA] hover:bg-[#1E1E24]"
                  }`}
                >
                  <span>{lang.name}</span>
                  <div className="flex items-center gap-1.5">
                    {lang.code && <span className="text-[9px] text-gray-600">{lang.code}</span>}
                    {value === lang.code && <Check className="w-3 h-3 text-teal-400" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
