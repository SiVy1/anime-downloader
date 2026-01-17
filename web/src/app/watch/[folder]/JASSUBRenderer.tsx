"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMediaPlayer, useMediaState } from "@vidstack/react";

/**
 * JASSUBRenderer - Native ASS/SSA subtitle renderer using JASSUB
 *
 * This component renders ASS subtitles with full styling support:
 * - Custom fonts, colors, and positioning
 * - Karaoke effects and animations
 * - Proper line breaks and typography
 *
 * It integrates with Vidstack player to sync subtitle timing with video playback.
 *
 * @param subtitleUrl - URL to the ASS/SSA subtitle file
 * @param fonts - Optional array of font URLs to preload
 */
interface JASSUBRendererProps {
  subtitleUrl: string;
  fonts?: string[];
}

export default function JASSUBRenderer({
  subtitleUrl,
  fonts = [],
}: JASSUBRendererProps) {
  const player = useMediaPlayer();
  const jassubRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current player state for sync
  const currentTime = useMediaState("currentTime");
  const paused = useMediaState("paused");

  // Initialize JASSUB when video element is available
  const initJassub = useCallback(async () => {
    if (!player || jassubRef.current) return;

    // Find the video element inside Vidstack player
    const videoEl = player.el?.querySelector("video");
    if (!videoEl) return;

    try {
      // Dynamic import to avoid SSR issues
      const JASSUB = (await import("jassub")).default;

      jassubRef.current = new JASSUB({
        video: videoEl,
        subUrl: subtitleUrl,
        fonts: fonts,
        workerUrl: "/jassub/jassub-worker.js",
        wasmUrl: "/jassub/jassub-worker.wasm",
        // Rendering options for better quality
        prescaleFactor: 1.0,
        prescaleHeightLimit: 1080,
        maxRenderHeight: 2160,
        // Debug mode off for production
        debug: false,
      });

      console.log("[JASSUB] Initialized with subtitle:", subtitleUrl);
    } catch (error) {
      console.error("[JASSUB] Failed to initialize:", error);
    }
  }, [player, subtitleUrl, fonts]);

  // Initialize on mount and when player is ready
  useEffect(() => {
    if (!player) return;

    // Wait for video element to be mounted
    const checkVideo = setInterval(() => {
      const videoEl = player.el?.querySelector("video");
      if (videoEl) {
        clearInterval(checkVideo);
        initJassub();
      }
    }, 100);

    return () => {
      clearInterval(checkVideo);
    };
  }, [player, initJassub]);

  // Update subtitle URL when it changes
  useEffect(() => {
    if (jassubRef.current && subtitleUrl) {
      jassubRef.current.setTrackByUrl(subtitleUrl);
      console.log("[JASSUB] Track changed to:", subtitleUrl);
    }
  }, [subtitleUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jassubRef.current) {
        jassubRef.current.destroy();
        jassubRef.current = null;
        console.log("[JASSUB] Destroyed");
      }
    };
  }, []);

  // JASSUB automatically syncs with video element, no manual time sync needed
  // The container is invisible as JASSUB renders directly on a canvas overlay
  return <div ref={containerRef} className="hidden" aria-hidden="true" />;
}
