import React from "react";
import { Search } from "lucide-react";

interface SeasonFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Year/Season selective buttons can be added here
}

export const SeasonFilters: React.FC<SeasonFiltersProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      <div className="relative flex-1 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj w tym sezonie..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all placeholder:text-white/20"
        />
      </div>

      {/* Optional: Add Year/Season dropdowns here in the future */}
    </div>
  );
};
