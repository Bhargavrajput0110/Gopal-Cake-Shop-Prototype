"use client";

import { motion } from "framer-motion";

export function CategoryCardsNav() {
  const cards = [
    {
      title: "Fresh Bakes",
      subtitle: "Daily baked bread & cakes",
      id: "fresh-bakes",
      imgUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    },
    {
      title: "Signature Cakes",
      subtitle: "Our premium collection",
      id: "signature-cakes",
      imgUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&q=80",
    },
    {
      title: "Fresh Florals",
      subtitle: "Beautiful bouquets",
      id: "fresh-florals",
      imgUrl: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600&q=80",
    }
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <section className="px-6 py-10 max-w-[1440px] mx-auto bg-background z-20 relative">
      <div className="grid grid-cols-3 gap-2 md:gap-4 pb-4 md:pb-0">
        {cards.map((card, index) => (
          <motion.a
            key={card.id}
            href={`#${card.id}`}
            onClick={(e) => handleScroll(e, card.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            className="group relative h-28 sm:h-32 md:h-48 w-full rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col justify-end p-3 md:p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${card.imgUrl}')` }}
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="relative z-10 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-0">
              <div>
                <h3 className="font-display font-bold md:font-black text-[13px] sm:text-base md:text-2xl text-white tracking-tight leading-tight">{card.title}</h3>
                <p className="hidden md:block font-ui text-[10px] uppercase tracking-widest text-white/80 font-bold mt-1">{card.subtitle}</p>
              </div>
              <div className="hidden md:flex w-10 h-10 rounded-full bg-white/20 backdrop-blur-md items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
