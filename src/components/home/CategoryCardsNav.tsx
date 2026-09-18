"use client";

import { motion } from "framer-motion";

export function CategoryCardsNav() {
  const cards = [
    {
      number: "01",
      title: "Fresh Bakes",
      subtitle: "Daily Bakes",
      id: "fresh-bakes",
      imgUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
      comingSoon: true,
    },
    {
      number: "02",
      title: "Signature Cakes",
      subtitle: "100% Eggless",
      id: "signature-cakes",
      imgUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&q=80",
      comingSoon: false,
    },
    {
      number: "03",
      title: "Fresh Florals",
      subtitle: "Bouquets",
      id: "fresh-florals",
      imgUrl: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80",
      comingSoon: true,
    }
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const sharedClasses = (comingSoon: boolean) =>
    `group relative h-32 sm:h-38 md:h-48 w-full rounded-2xl md:rounded-[1.75rem] overflow-hidden flex flex-col justify-end p-3 sm:p-4 md:p-6 border border-[var(--brand-champagne)]/20 shadow-sm transition-all duration-500 active:scale-[0.98] ${
      comingSoon ? "cursor-not-allowed opacity-85" : "hover:border-[var(--brand-champagne)]/60 hover:shadow-lg"
    }`;

  const cardContent = (card: typeof cards[number]) => (
    <>
      {/* Background Image with subtle scale */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url('${card.imgUrl}')` }}
      />
      {/* Dark Gradient Overlay for optimal contrast */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 transition-opacity duration-500"
      />
      {/* Symmetrical Top Header: Number left, Status tag right */}
      <div className="absolute top-2.5 sm:top-3.5 left-3 sm:left-3.5 right-3 sm:right-3.5 flex items-center justify-between z-20">
        <span className="font-display italic text-[10px] sm:text-xs text-[var(--brand-champagne)] font-semibold tracking-wider">
          {card.number}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] border backdrop-blur-md shadow-sm ${
          card.comingSoon
            ? "bg-black/40 border-white/20 text-white/70"
            : "bg-[var(--brand-deep-rose)]/90 border-[var(--brand-deep-rose)] text-white"
        }`}>
          {card.comingSoon ? "Soon" : "Available"}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col justify-end text-left">
        <h3 className="font-display italic font-semibold text-xs sm:text-sm md:text-xl text-white tracking-wide leading-tight drop-shadow-md">
          {card.title}
        </h3>
        <p className="font-ui text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-[var(--brand-champagne)] font-medium mt-0.5 opacity-90 truncate">
          {card.subtitle}
        </p>
      </div>
    </>
  );

  return (
    <section className="w-full bg-[var(--brand-cream)] py-5 md:py-8 border-b border-[var(--border)]/30 z-20 relative">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Minimalist Section Subhead */}
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-px bg-[var(--brand-champagne)]" />
            <span className="font-ui text-[8px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--brand-champagne)]">
              Curated Collections
            </span>
          </div>
          <span className="font-display italic text-[10px] md:text-xs text-foreground/40">Est. 1990</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-5">
          {cards.map((card, index) =>
            card.comingSoon ? (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
                className={sharedClasses(true)}
                aria-label={`${card.title} — Coming Soon`}
              >
                {cardContent(card)}
              </motion.div>
            ) : (
              <motion.a
                key={card.id}
                href={`#${card.id}`}
                onClick={(e) => handleScroll(e, card.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
                className={sharedClasses(false)}
              >
                {cardContent(card)}
              </motion.a>
            )
          )}
        </div>
      </div>
    </section>
  );
}
