"use client";

import { motion } from "framer-motion";

export function CategoryCardsNav() {
  const cards = [
    {
      number: "01",
      title: "Fresh Bakes",
      subtitle: "Artisanal breads & pastries",
      id: "fresh-bakes",
      imgUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
      comingSoon: true,
    },
    {
      number: "02",
      title: "Signature Cakes",
      subtitle: "Handcrafted 100% eggless",
      id: "signature-cakes",
      imgUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&q=80",
      comingSoon: false,
    },
    {
      number: "03",
      title: "Fresh Florals",
      subtitle: "Complementary bouquets",
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
    `group relative h-36 sm:h-44 md:h-56 w-full rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col justify-end p-4 md:p-6 border border-[var(--brand-champagne)]/20 shadow-sm transition-all duration-500 active:scale-[0.98] ${
      comingSoon ? "cursor-not-allowed opacity-90" : "hover:border-[var(--brand-champagne)]/60 hover:shadow-xl"
    }`;

  const cardContent = (card: typeof cards[number]) => (
    <>
      {/* Background Image with slow zoom */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url('${card.imgUrl}')` }}
      />
      {/* Dark Vignette Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-500 group-hover:opacity-85"
      />
      {/* Subtle Top Row: Number & Badge */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-20">
        <span className="font-display italic text-[11px] md:text-sm text-[var(--brand-champagne)] opacity-90 font-medium">
          {card.number}
        </span>
        {card.comingSoon ? (
          <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-[var(--brand-champagne)]/40 text-[var(--brand-champagne)] text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm">
            Coming Soon
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--brand-deep-rose)] text-white text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm">
            Order Now
          </span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col justify-end text-left">
        <h3 className="font-display italic font-semibold md:font-bold text-sm sm:text-base md:text-2xl text-white tracking-wide leading-tight drop-shadow-md">
          {card.title}
        </h3>
        <p className="font-ui text-[9px] md:text-[11px] uppercase tracking-[0.18em] text-[var(--brand-champagne)] font-medium mt-1 opacity-90">
          {card.subtitle}
        </p>
      </div>
    </>
  );

  return (
    <section className="w-full bg-[var(--brand-cream)] py-6 md:py-10 border-b border-[var(--border)]/30 z-20 relative">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        {/* Minimalist Section Subhead */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <span className="w-6 h-px bg-[var(--brand-champagne)]" />
            <span className="font-ui text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--brand-champagne)]">
              Curated Collections
            </span>
          </div>
          <span className="font-display italic text-xs md:text-sm text-foreground/40">Est. 1990</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 md:gap-5">
          {cards.map((card, index) =>
            card.comingSoon ? (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
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
