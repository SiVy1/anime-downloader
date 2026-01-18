"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { LogIn, LogOut, User, ChevronDown, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === "loading") {
    return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("anilist")}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-full text-white font-medium text-sm transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
      >
        <LogIn className="w-4 h-4" />
        <span>Zaloguj przez AniList</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="text-white/90 font-medium text-sm hidden sm:block">
          {session.user?.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 py-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50"
            >
              <div className="px-4 py-2 border-b border-white/5">
                <p className="text-white/90 font-medium text-sm">
                  {session.user?.name}
                </p>
                <p className="text-white/40 text-xs">
                  AniList ID: {session.user?.anilistId}
                </p>
              </div>

              <div className="py-1">
                <a
                  href={`https://anilist.co/user/${session.user?.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm">Mój profil AniList</span>
                </a>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Wyloguj</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
