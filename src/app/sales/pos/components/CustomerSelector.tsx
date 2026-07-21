import * as React from "react"
import { SearchNormal1, User, CloseSquare } from "iconsax-react"
import { useCart } from "@/context/CartContext"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"

export function CustomerSelector() {
  const { customerId, setCustomer } = useCart()
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-search', search],
    queryFn: async () => {
      const res = await fetchClient<{ success: boolean, data: any[] }>('/customers')
      const customersData = res.data || []
      return customersData.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone?.includes(search)
      ).slice(0, 5)
    },
    enabled: search.length > 2 || isOpen,
  })

  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const res = await fetchClient<{ success: boolean, data: any[] }>('/customers')
      return res.data || []
    }
  })
  
  const walkInCustomer = allCustomers.find((c: any) => c.email === 'walkin@gopalcakeshop.com')
  
  React.useEffect(() => {
    if (customerId === null && walkInCustomer) {
      setCustomer(walkInCustomer.id)
    }
  }, [customerId, walkInCustomer, setCustomer])

  const selectedCustomer = allCustomers.find((c: any) => c.id === customerId)

  return (
    <div className="relative z-50">
      <div className="flex flex-col gap-2">
        <label className="font-ui text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Active Customer</label>
        
        {selectedCustomer ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between bg-white border border-border hover:border-[var(--brand-deep-rose)]/50 transition-colors rounded-2xl p-3 shadow-sm relative overflow-hidden group">
              {selectedCustomer.isVip && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white font-ui text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                  VIP
                </div>
              )}
              <div className="flex items-center gap-3 overflow-hidden z-10">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                  <User className="w-5 h-5 text-muted-foreground" variant="Bold" />
                </div>
                <div className="truncate pr-6">
                  <p className="font-display text-lg font-bold text-foreground truncate leading-none mb-1">{selectedCustomer.name}</p>
                  <p className="font-ui text-[10px] tracking-widest uppercase text-emerald-600 font-black truncate">{selectedCustomer.phone || selectedCustomer.email}</p>
                </div>
              </div>
              {selectedCustomer.email !== 'walkin@gopalcakeshop.com' && (
                <button 
                  onClick={() => setCustomer(walkInCustomer?.id || null)}
                  className="p-2 hover:bg-rose-50 rounded-xl text-muted-foreground hover:text-rose-500 transition-colors shrink-0 z-10 relative"
                >
                  <CloseSquare className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Repeat Previous Order Stub */}
            {selectedCustomer.email !== 'walkin@gopalcakeshop.com' && (
              <button 
                onClick={() => alert("Repeat Last Order Triggered")}
                className="w-full font-ui text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-2.5 rounded-xl transition-colors text-center"
              >
                Repeat Last Order
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full text-left font-ui font-bold uppercase tracking-widest shadow-sm"
          >
            <SearchNormal1 className="w-5 h-5" />
            <span className="text-[10px]">Select Customer...</span>
          </button>
        )}
      </div>

      {/* Auto-complete Dropdown */}
      {isOpen && !selectedCustomer && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[300px] z-50">
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="relative">
              <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                autoFocus
                type="text" 
                placeholder="Name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-border rounded-xl text-foreground font-ui text-[11px] font-bold tracking-widest uppercase focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar bg-white">
            {isLoading ? (
              <div className="p-6 text-center font-editorial italic text-muted-foreground">Searching directory...</div>
            ) : customers.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center gap-4">
                <p className="font-editorial italic text-muted-foreground">No matches found.</p>
                {search.length >= 10 && (
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetchClient<{ success: boolean, data: any }>('/customers', {
                          method: 'POST',
                          body: JSON.stringify({
                            name: search,
                            phone: search,
                            email: `quick_${Date.now()}@temp.com`,
                          })
                        })
                        if (res.data && res.data.id) {
                          setCustomer(res.data.id)
                          setIsOpen(false)
                          setSearch("")
                        }
                      } catch (err) {
                         console.error('Failed to quick add customer', err)
                         alert("Failed to add customer")
                      }
                    }}
                    className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-ui uppercase tracking-widest font-black py-3 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    + Quick Add "{search}"
                  </button>
                )}
              </div>
            ) : (
              customers.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCustomer(c.id)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className="w-full text-left p-4 hover:bg-muted border-b border-border last:border-0 flex items-center justify-between group transition-colors"
                >
                  <div>
                    <p className="font-display font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors flex items-center gap-3">
                      {c.name}
                      {c.isVip && <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm">VIP</span>}
                    </p>
                    <p className="font-ui text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">{c.phone || c.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t border-border bg-muted/30 text-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-ui uppercase tracking-widest font-black text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
