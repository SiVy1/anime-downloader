import React from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

interface SeasonFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resultsCount: number;
}

export const SeasonFilters: React.FC<SeasonFiltersProps> = ({
  searchQuery,
  onSearchChange,
  resultsCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
      <div className="relative flex-1 group w-full">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-white/20 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Szukaj w tym sezonie..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-16 pr-6 h-16 bg-white/[0.02] border border-white/5 focus:border-blue-500/50 rounded-3xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-white/10 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em] glass-panel"
        />
        {searchQuery && (
          <div className="absolute inset-y-0 right-6 flex items-center">
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-500 uppercase tracking-widest shadow-lg shadow-blue-500/5 animate-in fade-in zoom-in duration-300">
              {resultsCount} wyników
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button className="flex-1 sm:flex-none h-16 px-8 glass-button rounded-3xl flex items-center justify-center gap-3 group">
          <SlidersHorizontal className="w-4 h-4 text-white/40 group-hover:text-white" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white">
            Filtry
          </span>
        </button>
      </div>
    </div>
  );
};
