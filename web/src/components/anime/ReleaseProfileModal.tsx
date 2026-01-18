"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Check, Loader2 } from "lucide-react";

interface ReleaseProfile {
  preferredGroups: string[];
  preferredQuality: string;
  excludeGroups: string[];
  autoDownload: boolean;
}

interface ReleaseProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  anilistId: number;
  animeTitle: string;
  onSave?: (profile: ReleaseProfile) => void;
}

const PRESET_GROUPS = [
  "SubsPlease",
  "Erai-raws",
  "Judas",
  "ASW",
  "Tsundere-Raws",
  "Anime Time",
  "EMBER",
  "Yameii",
];

const QUALITY_OPTIONS = ["720p", "1080p", "4K"];

export default function ReleaseProfileModal({
  isOpen,
  onClose,
  anilistId,
  animeTitle,
  onSave,
}: ReleaseProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ReleaseProfile>({
    preferredGroups: ["SubsPlease", "Erai-raws"],
    preferredQuality: "1080p",
    excludeGroups: [],
    autoDownload: true,
  });
  const [customExclude, setCustomExclude] = useState("");

  useEffect(() => {
    if (isOpen && anilistId) {
      fetchProfile();
    }
  }, [isOpen, anilistId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/anime/${anilistId}/release-profile`);
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch release profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/anime/${anilistId}/release-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        onSave?.(profile);
        onClose();
      }
    } catch (error) {
      console.error("Failed to save release profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (group: string) => {
    setProfile((prev) => ({
      ...prev,
      preferredGroups: prev.preferredGroups.includes(group)
        ? prev.preferredGroups.filter((g) => g !== group)
        : [...prev.preferredGroups, group],
    }));
  };

  const addExcludeGroup = () => {
    if (
      customExclude.trim() &&
      !profile.excludeGroups.includes(customExclude.trim())
    ) {
      setProfile((prev) => ({
        ...prev,
        excludeGroups: [...prev.excludeGroups, customExclude.trim()],
      }));
      setCustomExclude("");
    }
  };

  const removeExcludeGroup = (group: string) => {
    setProfile((prev) => ({
      ...prev,
      excludeGroups: prev.excludeGroups.filter((g) => g !== group),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">
                Profil Wydania
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
                {animeTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Preferred Groups */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Preferowane Grupy
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                        profile.preferredGroups.includes(group)
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Preferowana Jakość
                </label>
                <div className="flex gap-2">
                  {QUALITY_OPTIONS.map((quality) => (
                    <button
                      key={quality}
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          preferredQuality: quality,
                        }))
                      }
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        profile.preferredQuality === quality
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>

              {/* Excluded Groups */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Wykluczone Grupy
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customExclude}
                    onChange={(e) => setCustomExclude(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addExcludeGroup()}
                    placeholder="Nazwa grupy..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={addExcludeGroup}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors"
                  >
                    Dodaj
                  </button>
                </div>
                {profile.excludeGroups.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.excludeGroups.map((group) => (
                      <span
                        key={group}
                        className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 flex items-center gap-2"
                      >
                        {group}
                        <button
                          onClick={() => removeExcludeGroup(group)}
                          className="hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto Download Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-bold">Auto-Pobieranie</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                    Automatycznie pobieraj nowe odcinki
                  </p>
                </div>
                <button
                  onClick={() =>
                    setProfile((prev) => ({
                      ...prev,
                      autoDownload: !prev.autoDownload,
                    }))
                  }
                  className={`w-12 h-7 rounded-full transition-all relative ${
                    profile.autoDownload ? "bg-blue-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-lg ${
                      profile.autoDownload ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
