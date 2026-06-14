import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Dummy data for visual presentation
const categories = [
  "All Cakes", "Anniversary", "Birthday", "Kids", "Designer", "Eggless", "Photo Cakes"
];

const products = [
  { id: 1, name: "Premium Truffle Cake", price: 650, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop" },
  { id: 2, name: "Red Velvet Romance", price: 850, image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop" },
  { id: 3, name: "Ferrero Rocher Special", price: 1200, image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=500&auto=format&fit=crop" },
  { id: 4, name: "Butterscotch Delight", price: 550, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop" },
  { id: 5, name: "Black Forest Classic", price: 500, image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop" },
  { id: 6, name: "Mango Cheesecake", price: 900, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop" },
];

export default function MenuPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile-optimized Header / Filter Section */}
      <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur border-b border-border shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-3 items-center">
          {categories.map((cat, idx) => (
            <button 
              key={cat} 
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                idx === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FNP Style Catalog Grid */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6">Our Premium Selection</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image 
                      src={product.image} 
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Fast Ordering Badge - IndiaCakes simplicity style */}
                    <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-primary">
                      ★ 4.8
                    </div>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-foreground text-sm md:text-base line-clamp-1">{product.name}</h3>
                    <p className="text-primary font-bold mt-1">₹{product.price}</p>
                    <Button className="w-full mt-3 h-8 md:h-10 text-xs md:text-sm bg-primary hover:bg-primary/90 text-white rounded-md">
                      Select Flavor & Size
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
