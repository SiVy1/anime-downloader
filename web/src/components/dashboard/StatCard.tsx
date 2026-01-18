import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  color = "blue",
  trend,
}) => {
  const colorMap: Record<string, string> = {
    blue: "from-blue-600/20 to-blue-600/5 text-blue-400 border-blue-500/20",
    green: "from-green-600/20 to-green-600/5 text-green-400 border-green-500/20",
    purple: "from-purple-600/20 to-purple-600/5 text-purple-400 border-purple-500/20",
    yellow: "from-yellow-600/20 to-yellow-600/5 text-yellow-400 border-yellow-500/20",
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${selectedColor} border rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={80} />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
            <Icon size={20} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 group-hover:opacity-60 transition-opacity">
            {title}
          </h3>
        </div>

        <div className="space-y-1">
          <div className="text-4xl font-black italic tracking-tighter text-white">
            {value}
          </div>
          {description && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
              {description}
            </p>
          )}
        </div>

        {trend && (
          <div className={`text-[10px] font-black ${trend.isUp ? "text-green-400" : "text-red-400"} flex items-center gap-1`}>
             {trend.isUp ? "↑" : "↓"} {trend.value}% <span className="text-white/20 lowercase tracking-normal">last week</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
