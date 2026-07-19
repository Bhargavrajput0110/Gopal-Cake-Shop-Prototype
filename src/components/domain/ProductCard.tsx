import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type ProductCardProps = {
  id: string | number
  title: string
  category: string
  price: string
  image: string
  originalPrice?: string
  discountBadge?: string
  isNew?: boolean
  onQuickView?: () => void
}

export function ProductCard({
  id, title, category, price, image, originalPrice, discountBadge, isNew, onQuickView
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`} className="group flex flex-col cursor-pointer" data-testid={`product-card-${id}`}>
      {/* Product Image Box */}
      <div className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-secondary mb-4 overflow-hidden rounded-md">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discountBadge && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              {discountBadge}
            </span>
          )}
          {isNew && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              New
            </span>
          )}
        </div>

        {/* Quick Add overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out hidden md:block">
          <button 
            onClick={(e) => {
              if (onQuickView) {
                e.preventDefault(); // prevent navigation
                onQuickView();
              }
            }}
            className="w-full bg-background/95 backdrop-blur-md text-foreground text-xs font-bold py-3 uppercase tracking-widest shadow-lg hover:bg-foreground hover:text-background transition-colors rounded-sm"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-grow">
        <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">
          {category}
        </span>
        <h3 className="text-foreground font-sans font-medium text-sm md:text-base leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <div className="mt-auto pt-2 flex items-center gap-2">
          <span className="text-foreground font-sans font-bold text-sm md:text-base">
            {price}
          </span>
          {originalPrice && (
            <span className="text-muted-foreground text-xs line-through">
              {originalPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
