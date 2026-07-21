import * as React from "react"
import { SearchNormal1 } from "iconsax-react"
import { QuickBuyForm } from "@/components/menu/QuickBuyForm"

type Product = {
  id: string
  name: string
  price?: number
  basePrice?: number
  categoryId: string
  images: string[]
  thumbnail?: string
  sku?: string
  isCustomizable?: boolean
  category?: { name: string }
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
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null)
  
  const filteredProducts = React.useMemo(() => {
    const s = search.toLowerCase()
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s))
      const matchesCategory = selectedCategory ? (p.categoryId === selectedCategory || (categories.find(c => c.categoryId === selectedCategory)?.categoryId === p.categoryId) || (categories.find(c => c.slug === selectedCategory)?.categoryId === p.categoryId)) : true
      const exactMatch = selectedCategory ? p.categoryId === selectedCategory : true
      
      return matchesSearch && (selectedCategory ? (matchesCategory || exactMatch) : true)
    })
  }, [products, search, selectedCategory, categories])

  if (selectedProduct) {
    return (
      <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden relative shadow-sm border border-border">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-4">
          <button 
            onClick={() => setSelectedProduct(null)} 
            className="px-4 py-2 bg-white text-muted-foreground border border-border rounded-xl font-ui text-[11px] font-black uppercase tracking-widest hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            ← Back to Products
          </button>
          <span className="font-ui text-[11px] font-black uppercase tracking-widest text-muted-foreground">Configure Item</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <QuickBuyForm 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            isCustom={selectedProduct.id === 'custom-photo-cake'} 
            isPhotoCake={selectedProduct.id === 'custom-photo-cake'} 
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden relative border border-border shadow-sm">
      
      {/* Search Header */}
      <div className="p-6 border-b border-border bg-muted/30 space-y-4 relative z-10">
        <div className="relative">
          <SearchNormal1 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by Name, SKU, or Barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/60 font-ui text-[11px] font-bold tracking-widest uppercase focus:outline-none focus:border-[var(--brand-deep-rose)] transition-all shadow-sm"
          />
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 font-ui text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-full transition-all active:scale-95 border ${
              selectedCategory === null 
                ? "bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)] shadow-sm" 
                : "bg-white text-muted-foreground border-border hover:text-foreground hover:bg-muted"
            }`}
          >
            All Products
          </button>
          {categories.map(category => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategory(category.categoryId)}
              className={`px-6 py-3 font-ui text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-full transition-all active:scale-95 border ${
                selectedCategory === category.categoryId 
                  ? "bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)] shadow-sm" 
                  : "bg-white text-muted-foreground border-border hover:text-foreground hover:bg-muted"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-[var(--brand-deep-rose)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Custom Services Section */}
            <div>
              <h3 className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-deep-rose)]"></span> Custom Services
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                <button 
                  onClick={() => setSelectedProduct({
                    id: 'custom-photo-cake',
                    name: 'Custom Photo Cake',
                    basePrice: 800,
                    thumbnail: 'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=500&q=80',
                    isCustomizable: true,
                    category: { name: 'Custom Cakes' }
                  })}
                  className="flex flex-col text-left bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-sm"
                >
                  <div className="h-36 w-full bg-rose-900/10 flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1604147706283-d7119b5b822c?w=500&q=80')] bg-cover bg-center opacity-40 mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                    <span className="relative z-10 font-ui text-[10px] text-white bg-[var(--brand-deep-rose)] px-3 py-1.5 rounded-full font-black tracking-widest uppercase shadow-md">+ Add Photo Cake</span>
                  </div>
                  <div className="p-4 w-full bg-white">
                    <p className="font-display font-bold text-lg text-foreground truncate transition-colors">Custom Photo Cake</p>
                    <p className="font-ui text-[11px] uppercase tracking-widest font-bold text-muted-foreground mt-1">Starts at ₹800.00</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Standard Products */}
            <div>
              <h3 className="font-ui text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Standard Catalogue
              </h3>
              {filteredProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-16 font-editorial italic text-lg">No products found matching your search.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => setSelectedProduct({
                        id: product.id,
                        name: product.name,
                        basePrice: Number(product.basePrice || product.price || 0),
                        thumbnail: product.images?.[0],
                        isCustomizable: product.isCustomizable,
                        category: { name: categories.find(c => c.categoryId === product.categoryId)?.name || 'Cake' }
                      })}
                      className="flex flex-col text-left bg-white border border-border hover:border-[var(--brand-deep-rose)]/30 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] group shadow-sm"
                    >
                      <div className="h-36 w-full bg-muted flex items-center justify-center overflow-hidden relative">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <span className="font-ui text-[9px] text-muted-foreground uppercase font-bold tracking-widest">No Image</span>
                        )}
                      </div>
                      <div className="p-4 w-full bg-white">
                        <p className="font-display font-bold text-lg text-foreground truncate">{product.name}</p>
                        <p className="font-ui text-[11px] uppercase tracking-widest font-black text-muted-foreground mt-1">₹{Number(product.price || product.basePrice || 0).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html:`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}} />
    </div>
  )
}
