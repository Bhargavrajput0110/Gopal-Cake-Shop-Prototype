import * as React from "react"
import { SearchNormal1 } from "iconsax-react"
import { useCart } from "@/context/CartContext"

type Product = {
  id: string
  name: string
  price?: number
  basePrice?: number
  categoryId: string
  images: string[]
  sku?: string
  isCustomizable?: boolean
}

type Category = {
  categoryId: string
  name: string
  slug: string
  status: string
}

interface ProductGridProps {
  products: Product[]
  categories?: Category[]
  isLoading: boolean
}

export function ProductGrid({ products, categories = [], isLoading }: ProductGridProps) {
  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const { addItem } = useCart()

  const filteredProducts = React.useMemo(() => {
    const s = search.toLowerCase()
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s))
      const matchesCategory = selectedCategory ? (p.categoryId === selectedCategory || (categories.find(c => c.categoryId === selectedCategory)?.categoryId === p.categoryId) || (categories.find(c => c.slug === selectedCategory)?.categoryId === p.categoryId)) : true
      const exactMatch = selectedCategory ? p.categoryId === selectedCategory : true
      
      return matchesSearch && (selectedCategory ? (matchesCategory || exactMatch) : true)
    })
  }, [products, search, selectedCategory, categories])

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
      
      {/* Decorative Glow inside the panel */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Search Header */}
      <div className="p-6 border-b border-white/10 bg-black/20 space-y-4 relative z-10">
        <div className="relative">
          <SearchNormal1 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Name, SKU, or Barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 font-ui text-[11px] font-bold tracking-widest uppercase focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all"
          />
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 font-ui text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-full transition-all active:scale-95 ${
              selectedCategory === null 
                ? "bg-white text-gray-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            All Products
          </button>
          {categories.map(category => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategory(category.categoryId)}
              className={`px-6 py-3 font-ui text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-full transition-all active:scale-95 ${
                selectedCategory === category.categoryId 
                  ? "bg-white text-gray-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Custom Services Section */}
            <div>
              <h3 className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Custom Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                <button 
                  onClick={() => addItem({
                    productId: 'custom-photo-cake',
                    name: 'Custom Photo Cake',
                    price: 800,
                    image: 'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=500&q=80',
                    weight: 1,
                    quantity: 1,
                    isCustomizable: true,
                    notes: 'Photo upload attached'
                  })}
                  className="flex flex-col text-left bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-lg"
                >
                  <div className="h-36 w-full bg-indigo-900/50 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=500&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
                    <span className="relative z-10 font-ui text-[10px] text-white bg-indigo-600/80 backdrop-blur-md px-3 py-1.5 rounded-full font-black tracking-widest uppercase shadow-xl">+ Add Photo Cake</span>
                  </div>
                  <div className="p-4 w-full">
                    <p className="font-display font-bold text-lg text-white truncate group-hover:text-indigo-300 transition-colors">Custom Photo Cake</p>
                    <p className="font-ui text-[11px] uppercase tracking-widest font-bold text-indigo-400 mt-1">Starts at ₹800.00</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Standard Products */}
            <div>
              <h3 className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Standard Catalogue
              </h3>
              {filteredProducts.length === 0 ? (
                <div className="text-center text-gray-500 py-16 font-editorial italic text-lg">No products found matching your search.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => addItem({
                        productId: product.id,
                        name: product.name,
                        price: Number(product.basePrice || product.price || 0),
                        image: product.images?.[0],
                        weight: 1,
                        quantity: 1,
                        isCustomizable: product.isCustomizable
                      })}
                      className="flex flex-col text-left bg-black/40 backdrop-blur-md border border-white/5 hover:border-white/20 hover:bg-black/60 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-lg"
                    >
                      <div className="h-36 w-full bg-gray-900 flex items-center justify-center overflow-hidden relative">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                        ) : (
                          <span className="font-ui text-[9px] text-gray-600 uppercase font-bold tracking-widest">No Image</span>
                        )}
                        {/* Subtle inner shadow overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-50" />
                      </div>
                      <div className="p-4 w-full bg-white/[0.02]">
                        <p className="font-display font-bold text-lg text-white truncate">{product.name}</p>
                        <p className="font-ui text-[11px] uppercase tracking-widest font-black text-gray-400 mt-1">₹{Number(product.price || product.basePrice || 0).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
      
      {/* Custom Scrollbar CSS specifically for this POS grid if needed */}
      <style dangerouslySetInnerHTML={{__html:`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  )
}
