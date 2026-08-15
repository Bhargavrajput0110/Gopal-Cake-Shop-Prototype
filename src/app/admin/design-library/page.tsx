"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Add, Grid3, TaskSquare } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/components/ui/dashboard-widgets";
import { FacetedSidebar, FacetGroup } from "@/components/admin/designs/FacetedSidebar";
import { DesignCard, Design } from "@/components/admin/designs/DesignCard";
import { DesignPreviewModal } from "@/components/admin/designs/DesignPreviewModal";
import { BulkImportModal } from "@/components/admin/designs/BulkImportModal";
import { DesignFormModal } from "../designs/components/DesignFormModal";
import { BackButton } from "@/components/ui/BackButton";

// Mock facet groups for the sidebar
const facetGroups: FacetGroup[] = [
  {
    id: "labels",
    label: "Labels",
    options: [
      { label: "Bestseller", value: "Bestseller" },
      { label: "Trending", value: "Trending" },
      { label: "Festival", value: "Festival" },
      { label: "Premium", value: "Premium" },
      { label: "Kids", value: "Kids" },
      { label: "Luxury", value: "Luxury" }
    ]
  },
  {
    id: "occasions",
    label: "Occasion",
    options: [
      { label: "Birthday", value: "Birthday" },
      { label: "Anniversary", value: "Anniversary" },
      { label: "Wedding", value: "Wedding" },
      { label: "Baby Shower", value: "Baby Shower" }
    ]
  },
  {
    id: "themes",
    label: "Theme",
    options: [
      { label: "Floral", value: "Floral" },
      { label: "Superhero", value: "Superhero" },
      { label: "Princess", value: "Princess" },
      { label: "Minimalist", value: "Minimalist" }
    ]
  },
  {
    id: "styles",
    label: "Style",
    options: [
      { label: "Fondant", value: "Fondant" },
      { label: "Buttercream", value: "Buttercream" },
      { label: "Semi-Fondant", value: "Semi-Fondant" },
      { label: "Naked", value: "Naked" }
    ]
  }
];

// Complete 62 Gopal Cake Shop category catalog
const DEFAULT_62_CATEGORIES = [
  { categoryId: 'mom-cake', name: 'Mom Cake', slug: 'mom-cake' },
  { categoryId: 'women-cake', name: 'Women Cake', slug: 'women-cake' },
  { categoryId: 'baby-shower-cake', name: 'Baby Shower Cake', slug: 'baby-shower-cake' },
  { categoryId: 'welcome-baby-cake', name: 'Welcome Baby Cake', slug: 'welcome-baby-cake' },
  { categoryId: 'dad-cake', name: 'Dad Cake', slug: 'dad-cake' },
  { categoryId: 'men-cake', name: 'Men Cake', slug: 'men-cake' },
  { categoryId: 'boys-cake', name: 'Boys Cake', slug: 'boys-cake' },
  { categoryId: 'girls-cake', name: 'Girls Cake', slug: 'girls-cake' },
  { categoryId: 'fresh-flower-cake', name: 'Fresh Flower Cake', slug: 'fresh-flower-cake' },
  { categoryId: '1st-birthday-cake', name: '1st Birthday Cake', slug: '1st-birthday-cake' },
  { categoryId: '5th-birthday-cake', name: '5th Birthday Cake', slug: '5th-birthday-cake' },
  { categoryId: '13th-birthday-cake', name: '13th Birthday Cake', slug: '13th-birthday-cake' },
  { categoryId: 'rice-paper-cake', name: 'Rice Paper Cake', slug: 'rice-paper-cake' },
  { categoryId: 'isomalt-cake', name: 'Isomalt Cake', slug: 'isomalt-cake' },
  { categoryId: 'king-cake', name: 'King Cake', slug: 'king-cake' },
  { categoryId: 'cricket-cake', name: 'Cricket Cake', slug: 'cricket-cake' },
  { categoryId: 'football-cake', name: 'Football Cake', slug: 'football-cake' },
  { categoryId: 'teddy-cake', name: 'Teddy Cake', slug: 'teddy-cake' },
  { categoryId: 'jungle-cake', name: 'Jungle Cake', slug: 'jungle-cake' },
  { categoryId: 'rainbow-cake', name: 'Rainbow Cake', slug: 'rainbow-cake' },
  { categoryId: 'anniversary-cake', name: 'Anniversary Cake', slug: 'anniversary-cake' },
  { categoryId: '25th-anniversary-cake', name: '25th Anniversary Cake', slug: '25th-anniversary-cake' },
  { categoryId: 'bento-cake', name: 'Bento Cake', slug: 'bento-cake' },
  { categoryId: 'for-men', name: 'For Men', slug: 'for-men' },
  { categoryId: 'for-women', name: 'For Women', slug: 'for-women' },
  { categoryId: 'for-anniversary', name: 'For Anniversary', slug: 'for-anniversary' },
  { categoryId: 'couple-cake', name: 'Couple Cake', slug: 'couple-cake' },
  { categoryId: 'love-theme-cake', name: 'Love Theme Cake', slug: 'love-theme-cake' },
  { categoryId: 'unicorn-cake', name: 'Unicorn Cake', slug: 'unicorn-cake' },
  { categoryId: 'butterfly-cake', name: 'Butterfly Cake', slug: 'butterfly-cake' },
  { categoryId: 'kpop-demon-hunters-cake', name: 'KPop Demon Hunters Cake', slug: 'kpop-demon-hunters-cake' },
  { categoryId: 'fruit-cake', name: 'Fruit Cake', slug: 'fruit-cake' },
  { categoryId: 'super-mario-cake', name: 'Super Mario Cake', slug: 'super-mario-cake' },
  { categoryId: 'bow-cake', name: 'Bow Cake', slug: 'bow-cake' },
  { categoryId: 'starbucks-cake', name: 'Starbucks Cake', slug: 'starbucks-cake' },
  { categoryId: 'pinata-cake', name: 'Pinata Cake', slug: 'pinata-cake' },
  { categoryId: 'boss-baby-cake', name: 'Boss Baby Cake', slug: 'boss-baby-cake' },
  { categoryId: 'wife-cake', name: 'Wife Cake', slug: 'wife-cake' },
  { categoryId: 'astronaut-cake', name: 'Astronaut Cake', slug: 'astronaut-cake' },
  { categoryId: 'hamper-cake', name: 'Hamper Cake', slug: 'hamper-cake' },
  { categoryId: 'mickey-mouse-cake', name: 'Mickey Mouse Cake', slug: 'mickey-mouse-cake' },
  { categoryId: 'army-cake', name: 'Army Cake', slug: 'army-cake' },
  { categoryId: 'spiderman-cake', name: 'Spiderman Cake', slug: 'spiderman-cake' },
  { categoryId: '50th-anniversary-cake', name: '50th Anniversary Cake', slug: '50th-anniversary-cake' },
  { categoryId: 'graduation-cake', name: 'Graduation Cake', slug: 'graduation-cake' },
  { categoryId: 'corporate-cake', name: 'Corporate Cake', slug: 'corporate-cake' },
  { categoryId: 'doctor-cake', name: 'Doctor Cake', slug: 'doctor-cake' },
  { categoryId: 'bike-cake', name: 'Bike Cake', slug: 'bike-cake' },
  { categoryId: 'car-cake', name: 'Car Cake', slug: 'car-cake' },
  { categoryId: 'top-forward-cake', name: 'Top Forward Cake', slug: 'top-forward-cake' },
  { categoryId: 'levitating-cake', name: 'Levitating Cake', slug: 'levitating-cake' },
  { categoryId: 'mcqueen-cake', name: 'McQueen Cake', slug: 'mcqueen-cake' },
  { categoryId: 'dinosaur-cake', name: 'Dinosaur Cake', slug: 'dinosaur-cake' },
  { categoryId: 'engagement-cake', name: 'Engagement Cake', slug: 'engagement-cake' },
  { categoryId: 'harry-potter-cake', name: 'Harry Potter Cake', slug: 'harry-potter-cake' },
  { categoryId: 'evil-eye-cake', name: 'Evil Eye Cake', slug: 'evil-eye-cake' },
  { categoryId: 'hot-wheels-cake', name: 'Hot Wheels Cake', slug: 'hot-wheels-cake' },
  { categoryId: 'jcb-cake', name: 'JCB Cake', slug: 'jcb-cake' },
  { categoryId: 'cocomelon-cake', name: 'Cocomelon Cake', slug: 'cocomelon-cake' },
  { categoryId: 'batman-cake', name: 'Batman Cake', slug: 'batman-cake' },
  { categoryId: 'avengers-cake', name: 'Avengers Cake', slug: 'avengers-cake' },
  { categoryId: 'vintage-photos-cake', name: 'Vintage Photos Cake', slug: 'vintage-photos-cake' },
  { categoryId: 'alcohol-bottle-themed-cake', name: 'Alcohol Bottle Themed Cake', slug: 'alcohol-bottle-themed-cake' },
];

export default function DesignLibraryPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDesign, setPreviewDesign] = useState<Design | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [categories, setCategories] = useState<any[]>(DEFAULT_62_CATEGORIES);

  useEffect(() => {
    // Fetch categories from the database so new ones appear
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Combine fetched categories with defaults, removing duplicates by slug
          const map = new Map<string, any>();
          DEFAULT_62_CATEGORIES.forEach(c => map.set(c.slug || c.categoryId, c));
          data.forEach(c => map.set(c.slug || c.categoryId, c));
          setCategories(Array.from(map.values()));
        } else if (data && Array.isArray(data.data)) {
          const map = new Map<string, any>();
          DEFAULT_62_CATEGORIES.forEach(c => map.set(c.slug || c.categoryId, c));
          data.data.forEach((c: any) => map.set(c.slug || c.categoryId, c));
          setCategories(Array.from(map.values()));
        }
      })
      .catch(console.error);
  }, []);
  
  // Filters & Pagination
  const [currentTab, setCurrentTab] = useState("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchDesigns = async (currentPage: number, append: boolean = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        status: currentTab
      });
      if (searchQuery) params.set('search', searchQuery);
      
      Object.entries(selectedFacets).forEach(([key, values]) => {
        if (values.length > 0) {
          params.set(key, values.join(','));
        }
      });


      let apiItems: any[] = [];
      try {
        const res = await fetch(`/api/v1/designs?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          apiItems = json.data?.items || [];
          if (apiItems.length < 50) {
            setHasMore(false);
          }
        }
      } catch (err) {}

      if (append) {
        setDesigns(prev => {
          const combined: any[] = [...prev];
          const seen = new Set(prev.map(p => p.id || p.code || p.name));
          
          apiItems.forEach(item => {
            const key = item.id || item.code || item.name;
            if (key && !seen.has(key)) {
              seen.add(key);
              let img = item.imageUrl || item.thumbnail || "";
              if (!img || img.includes("example.com") || img.includes("sample.jpg") || img.includes("mock")) {
                img = "https://images.unsplash.com/photo-1601050690597-df0568a70950?w=600&auto=format&fit=crop&q=80";
              }
              combined.push({ ...item, imageUrl: img, thumbnail: img });
            }
          });
          return combined;
        });
      } else {
        const combined: any[] = [];
        const seen = new Set();
        [...apiItems].forEach(item => {
          const key = item.id || item.code || item.name;
          if (key && !seen.has(key)) {
            seen.add(key);
            let img = item.imageUrl || "";
            if (!img || img.includes("example.com") || img.includes("sample.jpg") || img.includes("blob:")) {
              img = "https://images.unsplash.com/photo-1601050690597-df0568a70950?w=600&auto=format&fit=crop&q=80";
            }
            combined.push({ ...item, imageUrl: img });
          }
        });
        setDesigns(combined);
      }
      
      setIsLoading(false);
      return;
    } catch (error) {
      console.warn("API failed, using local fallback");
    } finally {
      setIsLoading(false);
    }
    
    setHasMore(false);
  };

  // Debounced search & filter change
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      fetchDesigns(1, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedFacets, currentTab]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchDesigns(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  const handleFacetChange = (groupId: string, value: string, checked: boolean) => {
    setSelectedFacets(prev => {
      const groupValues = prev[groupId] || [];
      if (checked) {
        return { ...prev, [groupId]: [...groupValues, value] };
      } else {
        return { ...prev, [groupId]: groupValues.filter(v => v !== value) };
      }
    });
  };

  const handleStatusChange = async (design: Design, newStatus: string) => {
    try {
      await fetch(`/api/v1/designs/${design.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      fetchDesigns(page, false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteForever = async (design: Design) => {
    if (!confirm(`Are you sure you want to permanently delete "${design.name}"? This cannot be undone.`)) return
    
    try {
      await fetch(`/api/v1/designs/${design.id}`, {
        method: "DELETE"
      })
      fetchDesigns(page, false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 pb-16 h-full flex flex-col">
      <DashboardSection 
        title="Design Library"
        description="Browse and manage your cake design knowledge base."
        action={
          <div className="flex gap-3">
            <BackButton fallback="/admin" label="Back" variant="outline" />
            <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              Bulk Import
            </Button>
            <Button onClick={() => { setEditingDesign(null); setIsDesignModalOpen(true); }}>
              <Add className="w-4 h-4 mr-2" /> Add Design
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-border flex gap-6 px-1">
        {["DRAFT", "ACTIVE", "ARCHIVED", "TRASHED"].map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              currentTab === tab 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 items-start mt-4">
        {/* Sidebar */}
        <FacetedSidebar 
          groups={facetGroups}
          selectedFacets={selectedFacets}
          onFacetChange={handleFacetChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Grid */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {designs.map(design => (
              <div key={design.id} onClick={() => setPreviewDesign(design)} className="cursor-pointer">
                <DesignCard 
                  design={design} 
                  onEdit={(d) => { setEditingDesign(d); setIsDesignModalOpen(true); }}
                  onClone={(d) => console.log('Clone', d)}
                  onStatusChange={handleStatusChange}
                  onDeleteForever={handleDeleteForever}
                />
              </div>
            ))}
          </div>
          
          {/* Empty State */}
          {!isLoading && designs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border mt-4">
              <p className="text-lg font-bold text-foreground mb-1">No designs found</p>
              <p className="text-muted-foreground text-sm max-w-sm">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              {(searchQuery || Object.keys(selectedFacets).length > 0) && (
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchQuery("");
                  setSelectedFacets({});
                }}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Loading Indicator & Scroll Target */}
          <div ref={observerTarget} className="py-8 flex justify-center">
            {isLoading && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      <DesignPreviewModal 
        isOpen={!!previewDesign}
        design={previewDesign}
        onClose={() => setPreviewDesign(null)}
        onEdit={(d) => { setPreviewDesign(null); setEditingDesign(d); setIsDesignModalOpen(true); }}
        onCopyToOrder={(d) => {
          console.log('Copy to order', d)
          setPreviewDesign(null)
        }}
        onDelete={async (d) => {
          await handleDeleteForever(d);
          setPreviewDesign(null);
        }}
      />

      <BulkImportModal 
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {isDesignModalOpen && (
        <DesignFormModal
          isOpen={isDesignModalOpen}
          onClose={() => { 
            setIsDesignModalOpen(false); 
            setEditingDesign(null); 
            fetchDesigns(1, false);
          }}
          initialData={editingDesign}
          categories={categories}
        />
      )}
    </div>
  );
}
