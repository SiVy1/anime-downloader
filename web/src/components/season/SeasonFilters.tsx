import React from "react";
import { Search } from "lucide-react";

interface SeasonFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount?: number;
}

export const SeasonFilters: React.FC<SeasonFiltersProps> = ({
  searchQuery,
  onSearchChange,
  resultsCount,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
      <div className="relative flex-1 w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all duration-300" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj w tym sezonie..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-white/20"
        />
        {searchQuery && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
              {resultsCount} wyników
            </span>
          </div>
        )}
      </div>

      {/* Optional: Add Year/Season dropdowns here in the future */}
    </div>
  );
};
