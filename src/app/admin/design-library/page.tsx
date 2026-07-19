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

export default function DesignLibraryPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDesign, setPreviewDesign] = useState<Design | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/categories').then(res => res.json()).then(data => {
      if(data.data) setCategories(data.data);
    }).catch(console.error);
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
        limit: '24',
        status: currentTab
      });
      if (searchQuery) params.set('search', searchQuery);
      
      Object.entries(selectedFacets).forEach(([key, values]) => {
        if (values.length > 0) {
          params.set(key, values.join(','));
        }
      });

      const res = await fetch(`/api/v1/designs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const newItems = json.data.items;
        
        if (newItems && newItems.length > 0) {
          if (append) {
            setDesigns(prev => [...prev, ...newItems]);
          } else {
            setDesigns(newItems);
          }
          setHasMore(json.data.hasMore);
          return;
        }
      }
    } catch (error) {
      console.warn("API failed, falling back to mock designs");
    } finally {
      setIsLoading(false);
    }
    
    // Fallback Mock Data for UI Prototyping
    const mockDesigns: Design[] = [
      { id: "des-01", code: "SPIDERMAN-01", name: "Spider-Man Red Web Topper", status: "ACTIVE", labels: ["Bestseller", "Kids"], themes: ["Superhero"], imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568a70950?w=400" },
      { id: "des-02", code: "ROSE-GOLD-01", name: "Rose Gold Floral Drip", status: "ACTIVE", labels: ["Premium", "Trending"], themes: ["Floral"], occasions: ["Wedding", "Anniversary"], imageUrl: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400" },
      { id: "des-03", code: "MINIMAL-WHITE", name: "Classic White Pearl Edge", status: "ACTIVE", labels: [], themes: ["Minimalist"], occasions: ["Wedding"], imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" }
    ];
    setDesigns(mockDesigns);
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
                  onEdit={(d) => console.log('Edit', d)}
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
        onCopyToOrder={(d) => {
          console.log('Copy to order', d)
          setPreviewDesign(null)
        }}
      />

      <BulkImportModal 
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <DesignFormModal
        isOpen={isDesignModalOpen}
        onClose={() => { setIsDesignModalOpen(false); setEditingDesign(null); }}
        initialData={editingDesign}
        categories={categories}
      />
    </div>
  );
}
