"use client";

import { useEffect, useState, useRef } from "react";
import { Refresh2, Location } from "iconsax-react";
import dynamic from "next/dynamic";

// Dynamically import the map to avoid SSR and Hook issues
const LeafletMapInner = dynamic(() => import("./LeafletMapInner"), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-secondary text-muted-foreground"><Refresh2 className="w-6 h-6 animate-spin" /></div>
});

// The 4 Branches of Gopal Bakery [lng, lat] for OSRM
const branchLocations = [
  { name: "Khanderao Market", coords: [73.1931, 22.2982] },
  { name: "Uma Char Rasta", coords: [73.1593, 22.3168] },
  { name: "Factory Warashiya", coords: [73.2100, 22.3218] },
  { name: "Ellora Park", coords: [73.1613, 22.3188] }
];

type DistanceResult = { branch: string; distanceKm: number };

interface LeafletAddressPickerProps {
  onDistancesCalculated: (distances: DistanceResult[], error: string) => void;
  onAddressChange: (address: string) => void;
  onCalculating: (isCalculating: boolean) => void;
}

export function LeafletAddressPicker({ onDistancesCalculated, onAddressChange, onCalculating }: LeafletAddressPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
   
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Nominatim Autocomplete restricted to Vadodara & Nearby (Anand/Nadiad)
  useEffect(() => {
    if (searchQuery.length < 3) {
       
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Append Vadodara explicitly if user didn't type it, to force accurate local searches
        const queryWithCity = searchQuery.toLowerCase().includes("vadodara") || searchQuery.toLowerCase().includes("anand") 
          ? searchQuery 
          : `${searchQuery}, Vadodara`;

        // viewbox limits search strictly to the Gujarat area around Vadodara/Anand
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&countrycodes=in&viewbox=72.8,22.8,73.5,22.0&bounded=1&limit=5`;
        
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Geocoding error", err);
      } finally {
        setIsSearching(false);
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

   
  const handleSelectAddress = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSelectedLocation({ lat, lng });
    setSearchQuery(result.display_name);
    setSearchResults([]);
    onAddressChange(result.display_name);
  };

  // Calculate Distances via Free OSRM API
  useEffect(() => {
    if (!selectedLocation) return;
    
    const calculateDistanceMatrix = async () => {
      onCalculating(true);
      
      try {
        const promises = branchLocations.map(async (branch) => {
          const url = `https://router.project-osrm.org/route/v1/driving/${selectedLocation.lng},${selectedLocation.lat};${branch.coords[0]},${branch.coords[1]}?overview=false`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.code === "Ok" && data.routes.length > 0) {
            return { branch: branch.name, distanceKm: Number((data.routes[0].distance / 1000).toFixed(1)) };
          }
          return { branch: branch.name, distanceKm: 999 };
        });

        const results = await Promise.all(promises);
        const sorted = results.sort((a, b) => a.distanceKm - b.distanceKm);
        onDistancesCalculated(sorted, "");
      } catch (_err) {
        onDistancesCalculated([], "Failed to calculate distances via OSRM.");
      } finally {
        onCalculating(false);
      }
    };

    calculateDistanceMatrix();
     
  }, [selectedLocation]);

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <label className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>Search Your Address</span>
          <button 
            type="button" 
            onClick={() => setIsMapOpen(!isMapOpen)}
            className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition"
          >
            {isMapOpen ? "Hide Map" : "Pin on Map"}
          </button>
        </label>
        
        <div className="relative z-50">
          <Location className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type your society or building name..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-base relative z-50"
          />
          {isSearching && <Refresh2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        
        <p className="text-xs text-muted-foreground italic flex justify-between">
          <span>Powered by OpenStreetMap (100% Free)</span>
        </p>

        {searchResults.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button
                key={i}
                onClick={() => handleSelectAddress(res)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-secondary border-b border-border/50 last:border-0 transition-colors"
              >
                {res.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMapOpen && (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border shadow-inner relative z-0">
          <LeafletMapInner 
            position={selectedLocation}
            setPosition={(pos) => {
              setSelectedLocation(pos);
              onAddressChange("Custom Pinned Location on Map");
            }}
          />
          <div className="absolute top-2 left-2 right-2 bg-secondary/90 backdrop-blur-sm p-2 rounded-lg text-center text-xs text-foreground font-medium shadow-md pointer-events-none z-[1000]">
            Click anywhere on the map to pin your exact house.
          </div>
        </div>
      )}
    </div>
  );
}
