import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface TopNavSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function TopNavSearch({ 
  onSearch, 
  placeholder = "Search projects, tags, status..." 
}: TopNavSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Simple debounced search - no URL synchronization
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for search only
    debounceTimerRef.current = setTimeout(() => {
      onSearch(newQuery);
    }, 300);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  // Keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("storyboard-search")?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        className={`
          relative flex items-center gap-3 px-4 py-2.5 rounded-xl border
          transition-all duration-200 bg-[#1a1a24] border-white/10
          ${isFocused ? "border-white/20 bg-[#222238]" : ""}
        `}
      >
        <Search className="w-4 h-4 text-gray-400" />
        <input
          id="storyboard-search"
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 
                   outline-none text-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Keyboard shortcut hint */}
      {!query && !isFocused && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          Ctrl+K
        </div>
      )}
    </div>
  );
}
