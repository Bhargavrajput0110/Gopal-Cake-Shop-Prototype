import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF8F2] px-6 text-center relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle, #C8A97E 0%, transparent 70%)" }}
      />

      {/* Crown */}
      <div className="relative mb-6">
        <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
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

      {/* Big 404 */}
      <p
        className="text-[8rem] md:text-[12rem] font-black leading-none select-none"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          background: "linear-gradient(135deg, #E8D5C4 0%, #C8A97E 40%, #D4AF37 70%, #C8A97E 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </p>

      {/* Label */}
      <p className="text-xs font-bold tracking-[0.35em] uppercase text-[#C8A97E] -mt-4 mb-5">
        Page Not Found
      </p>

      {/* Heading */}
      <h1
        className="text-2xl md:text-3xl font-black text-[#1C0F0A] mb-3"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        This page doesn't exist
      </h1>

      {/* Subtext */}
      <p className="text-[#7A5C52] max-w-sm mb-8 text-sm leading-relaxed">
        The page you're looking for may have been moved, deleted, or never existed.
      </p>

      {/* Gold line */}
      <div
        className="mb-8"
        style={{
          height: 1,
          width: 120,
          background: "linear-gradient(90deg, transparent, #C8A97E, transparent)",
        }}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Link href="/" className="btn-primary">
          Go Home
        </Link>
        <Link href="/menu" className="btn-secondary">
          Browse Menu
        </Link>
      </div>

      {/* Est. tagline */}
      <p className="absolute bottom-8 text-[9px] tracking-[0.5em] uppercase text-[#C8A97E]/30">
        Est. 1995 · Vadodara
      </p>
    </div>
  )
}
