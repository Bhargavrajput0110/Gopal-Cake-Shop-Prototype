"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring (Sentry etc.) in production
    console.error("[Global Error Boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF8F2] px-6 text-center">
      {/* Ambient glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle, #C8A97E 0%, transparent 70%)" }}
      />

      {/* Crown icon */}
      <div className="relative mb-8">
        <svg width="48" height="36" viewBox="0 0 52 40" fill="none" className="opacity-40">
          <path
            d="M4 36 L4 20 L16 28 L26 4 L36 28 L48 20 L48 36 Z"
            stroke="#C8A97E"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="26" cy="4" r="2.5" fill="#C8A97E" />
          <circle cx="4" cy="20" r="2.5" fill="#C8A97E" />
          <circle cx="48" cy="20" r="2.5" fill="#C8A97E" />
        </svg>
      </div>

      {/* Error code */}
      <p className="text-xs font-bold tracking-[0.35em] uppercase text-[#C8A97E] mb-4">
        Something went wrong
      </p>

      {/* Heading */}
      <h1
        className="text-4xl md:text-5xl font-black text-[#1C0F0A] mb-4 leading-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Unexpected Error
      </h1>

      {/* Subtext */}
      <p className="text-[#7A5C52] max-w-md mb-2 text-base leading-relaxed">
        An unexpected error occurred. Our team has been notified.
      </p>

      {/* Error digest for support */}
      {error.digest && (
        <p className="text-xs text-[#C8A97E]/60 font-mono mb-8">
          Error ID: {error.digest}
        </p>
      )}

      {/* Divider */}
      <div
        className="mb-8 mt-4"
        style={{
          height: 1,
          width: 120,
          background: "linear-gradient(90deg, transparent, #C8A97E, transparent)",
        }}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="btn-primary"
        >
          Try Again
        </button>
        <a
          href="/"
          className="btn-secondary"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
