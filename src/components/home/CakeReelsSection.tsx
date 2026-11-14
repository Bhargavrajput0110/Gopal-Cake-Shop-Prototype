"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Heart,
  ExternalLink,
  Flame,
  Cake,
} from "lucide-react";
import { Instagram } from "iconsax-react";

export interface CakeReelItem {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  badge: string;
  category: string;
  views: string;
  likes: number;
  orderHref: string;
  caption: string;
}

const REELS_DATA: CakeReelItem[] = [
  {
    id: "reel-1",
    title: "Grand Celebration Masterpiece",
    subtitle: "Pure Belgian Chocolate Decadence & Hand-Crafted Layers",
    videoUrl:
      "https://res.cloudinary.com/slprqeid/video/upload/v1794636080/AQM68PFgCFMDtFENr9Jg5RC4a0wuMkXGSyACAGWEmHgIFraGMOj0Ohh9uJGR_i3PJEB0hx2hbijSJqgpvkkqDBT8i4XySe3eF0oHFGM.mp4",
    badge: "✨ Trending Reel",
    category: "Signature Designer Cake",
    views: "52.4K",
    likes: 3840,
    orderHref: "/custom",
    caption:
      "Watch our pastry chefs sculpt, frost, and crown this bespoke celebration cake fresh from our central kitchen in Vadodara.",
  },
  {
    id: "reel-2",
    title: "Artisan Piping & Berry Bloom",
    subtitle: "100% Pure Eggless • Fresh Floral & Berry Finish",
    videoUrl:
      "https://res.cloudinary.com/slprqeid/video/upload/v1794635889/AQPNN56h_Qv3XeTl2TFdXzcCebpuh9Hww-rrYlC7fgILXqZ6sKR2ClwO-5GJoWlEeL9duvJhr1okUKIr7vUaTpHFgyFYv5MTN9-YgQo.mp4",
    badge: "🎂 Fresh from Kitchen",
    category: "Vintage Floral Theme",
    views: "68.9K",
    likes: 5120,
    orderHref: "/custom",
    caption:
      "Velvety cream swirls, delicate piping artistry, and botanic freshness. Every petal and swirl crafted by hand.",
  },
  {
    id: "reel-3",
    title: "Royal Golden Fondant Symphony",
    subtitle: "Multi-Tier Luxury Wedding & Milestone Cake",
    videoUrl:
      "https://res.cloudinary.com/slprqeid/video/upload/v1794635840/AQNF2L_tRssFYWmIr-3qNiVPOM5BDUnl4wMwqW3vZCgFSWrZBpxpFjWAXcB5we7Hxo6AJJgZwWTvs62yZlqHy9EYHSEmWxCssFD4634_1.mp4",
    badge: "👑 Signature Craft",
    category: "Royal Wedding Bakes",
    views: "94.1K",
    likes: 7890,
    orderHref: "/custom",
    caption:
      "From structure to gold leaf detailing, witness how unforgettable wedding and milestone centrepieces come to life.",
  },
];

interface ReelCardProps {
  reel: CakeReelItem;
  isActiveSound: boolean;
  onToggleSound: () => void;
  isInView: boolean;
}

function ReelCard({ reel, isActiveSound, onToggleSound, isInView }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(reel.likes);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<"play" | "pause" | null>(null);
  const lastTapRef = useRef<number>(0);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isActiveSound;
    }
  }, [isActiveSound]);

  // Handle in-view play / pause optimization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView && isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented by browser policy (expected if unmuted without user gesture)
        });
      }
    } else {
      video.pause();
    }
  }, [isInView, isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setActionFeedback("play");
        setTimeout(() => setActionFeedback(null), 700);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      setActionFeedback("pause");
      setTimeout(() => setActionFeedback(null), 700);
    }
  }, []);

  const triggerLikeBurst = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Avoid triggering toggle when clicking interactive buttons
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      triggerLikeBurst();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      togglePlayPause();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex-none w-[82vw] sm:w-[340px] md:w-full aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 hover:border-[var(--brand-champagne)]/60 transition-all duration-500 cursor-pointer select-none snap-center"
      style={{
        boxShadow: "0 25px 50px -12px rgba(28, 15, 10, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* ── Background Video ─────────────────────────────────── */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        playsInline
        loop
        muted={!isActiveSound}
        autoPlay
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* ── Top & Bottom Scrim Gradients (Godly Design & Magic UI) ─ */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />

      {/* ── Video Progress Bar (Top Edge) ────────────────────── */}
      <div className="absolute top-0 inset-x-0 h-1 bg-white/20 z-20">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--brand-champagne)] to-amber-300 transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Top Header Controls ──────────────────────────────── */}
      <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between pointer-events-auto">
        {/* Shimmer Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>{reel.badge}</span>
        </div>

        {/* Audio Mute/Unmute Button (Smooth UI) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSound();
          }}
          aria-label={isActiveSound ? "Mute audio" : "Unmute audio"}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-[var(--brand-champagne)] shadow-md"
        >
          {isActiveSound ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-white/80" />
          )}
        </button>
      </div>

      {/* ── Center Feedback Indicator (Play/Pause Animation) ── */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl">
              {actionFeedback === "play" ? (
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              ) : (
                <Pause className="w-7 h-7 text-white fill-white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Double Tap Floating Heart Burst ──────────────────── */}
      <AnimatePresence>
        {showHeartBurst && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: [0, 1.4, 1.1], opacity: [0, 1, 0.9], y: -20 }}
            exit={{ scale: 1.6, opacity: 0, y: -60 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right-Side Engagement Sidebar (Reel Style) ───────── */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 pointer-events-auto">
        {/* Like Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isLiked) {
              setIsLiked(false);
              setLikeCount((prev) => prev - 1);
            } else {
              triggerLikeBurst();
            }
          }}
          className="flex flex-col items-center gap-1 group/btn"
        >
          <div
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 border ${
              isLiked
                ? "bg-rose-500/20 text-rose-500 border-rose-500/50 scale-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                : "bg-black/50 text-white/90 border-white/20 hover:bg-black/75 hover:text-white"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform group-hover/btn:scale-110 ${
                isLiked ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </div>
          <span className="text-[10px] font-bold text-white/90 drop-shadow-md">
            {likeCount.toLocaleString()}
          </span>
        </button>

        {/* Views Count */}
        <div className="flex flex-col items-center gap-1 text-white/80">
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] font-bold drop-shadow-md">{reel.views}</span>
        </div>

        {/* Instagram Share Link */}
        <a
          href="https://www.instagram.com/gopalcakeshop"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md"
          title="Open in Instagram"
        >
          <Instagram className="w-5 h-5 text-white" variant="Bold" />
        </a>
      </div>

      {/* ── Bottom Content Drawer (Godly & Shadcn Styling) ────── */}
      <div className="absolute inset-x-3.5 bottom-3.5 z-20 pointer-events-auto pr-14">
        {/* Category Pill */}
        <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--brand-champagne)]/25 text-amber-200 border border-amber-300/30 backdrop-blur-sm">
            {reel.category}
          </span>
          <span className="text-[10px] text-white/60 font-medium">100% Eggless</span>
        </div>

        {/* Reel Title & Subtitle */}
        <h3 className="font-serif text-base sm:text-lg font-bold text-white leading-tight drop-shadow-md">
          {reel.title}
        </h3>
        <p className="text-[11px] text-white/80 font-sans mt-0.5 line-clamp-2 leading-relaxed drop-shadow-sm">
          {reel.caption}
        </p>

        {/* CTA Button: Customize / Order Similar Cake */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={reel.orderHref}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 border border-white/20 shadow-lg transition-all duration-200 active:scale-95 group/cta"
          >
            <Cake className="w-3.5 h-3.5 text-white" />
            <span>Order This Design</span>
            <ExternalLink className="w-3 h-3 text-white/70 group-hover/cta:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CakeReelsSection() {
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState<boolean>(true);

  // Intersection Observer to pause/play videos when scrolled out of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
          if (!entry.isIntersecting) {
            // Auto mute when section goes out of view
            setActiveSoundId(null);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleToggleSound = (id: string) => {
    setActiveSoundId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      ref={sectionRef}
      id="bakery-reels"
      className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-background via-[var(--muted)]/30 to-background border-y border-border/60"
    >
      {/* ── Ambient Background Glow (Godly.design Inspiration) ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-[var(--primary)]/8 via-[var(--brand-champagne)]/12 to-rose-400/8 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ───────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Shimmering Instagram Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase border border-[var(--brand-champagne)]/40 bg-[var(--brand-champagne)]/10 text-foreground mb-4 backdrop-blur-xs shadow-xs">
            <Instagram className="w-4 h-4 text-rose-600" variant="Bold" />
            <span className="font-sans">Bakery Studio &bull; Live Reels</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            Artistry in Every Layer
          </h2>

          <p className="font-editorial italic text-muted-foreground text-base sm:text-lg mt-3 leading-relaxed">
            Step behind the counter and witness the precision, handcrafted fondant work, and 100% pure eggless cake magic made fresh daily in Vadodara.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1 text-[var(--primary)] font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Tap reel to play / pause
            </span>
            <span>&bull;</span>
            <span>Double tap to like ❤️</span>
            <span>&bull;</span>
            <span className="hidden sm:inline">Sound toggle on top right 🔊</span>
          </div>
        </div>

        {/* ── Reels Grid & Mobile Carousel ─────────────────────── */}
        <div className="relative">
          {/* Flex on mobile with horizontal snap, 3 columns on tablet/desktop */}
          <div className="flex md:grid md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-none pb-4 pt-1 px-1">
            {REELS_DATA.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                isActiveSound={activeSoundId === reel.id}
                onToggleSound={() => handleToggleSound(reel.id)}
                isInView={isInView}
              />
            ))}
          </div>

          {/* Mobile swipe hint */}
          <div className="md:hidden flex items-center justify-center gap-2 mt-4 text-xs font-bold text-muted-foreground">
            <span>← Swipe to watch more bakes →</span>
          </div>
        </div>

        {/* ── Section Footer / Instagram Banner (RetroUI / Magic UI) ─ */}
        <div className="mt-14 sm:mt-18 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px] shadow-md shrink-0">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                <Instagram className="w-6 h-6 text-rose-600" variant="Bold" />
              </div>
            </div>
            <div>
              <p className="font-bold text-foreground text-sm flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Follow @gopalcakeshop</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  Daily Stories
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Join 25,000+ Vadodara dessert lovers on Instagram for secret flavors & daily fresh cake drops.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="https://www.instagram.com/gopalcakeshop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:opacity-95 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Instagram className="w-4 h-4 text-white" variant="Bold" />
              <span>Watch on Instagram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/custom"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-foreground bg-card hover:bg-muted border border-border transition-all active:scale-95 shadow-xs"
            >
              <span>Build Custom Cake</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
