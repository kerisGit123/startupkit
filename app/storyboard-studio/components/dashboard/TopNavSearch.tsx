import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface TopNavSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function TopNavSearch({
  onSearch,
  placeholder = "Search frames, tags, status..."
}: TopNavSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => onSearch(newQuery), 300);
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

  useEffect(() => {
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, []);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors ${
        isFocused
          ? "border-(--accent-blue)/40 bg-white/5"
          : "border-(--border-primary) hover:border-(--border-secondary)"
      }`}
    >
      <Search className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0" strokeWidth={1.75} />
      <input
        id="storyboard-search"
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="bg-transparent text-[12px] text-(--text-primary) placeholder:text-(--text-tertiary) outline-none w-[180px]"
      />
      {query && (
        <button onClick={handleClear} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          <X className="w-3 h-3 text-(--text-tertiary)" />
        </button>
      )}
    </div>
  );
}
