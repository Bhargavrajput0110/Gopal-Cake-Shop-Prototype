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

// Haversine distance formula fallback
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

interface LeafletAddressPickerProps {
  onDistancesCalculated: (distances: DistanceResult[], error: string) => void;
  onAddressChange: (address: string) => void;
  onCalculating: (isCalculating: boolean) => void;
  onLocationSelected?: (lat: number, lng: number) => void;
}

export function LeafletAddressPicker({ onDistancesCalculated, onAddressChange, onCalculating, onLocationSelected }: LeafletAddressPickerProps) {
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
      } catch (_err) {
        // Suppress console.error to prevent Next.js dev overlay from taking over the screen
        // Nominatim can occasionally drop requests, we just fail silently and let them type.
      } finally {
        setIsSearching(false);
      }
    }, 800);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setSelectedLocation({ lat, lng });
      if (onLocationSelected) onLocationSelected(lat, lng);
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const addressName = data.display_name || "Current Location";
        setSearchQuery(addressName);
        onAddressChange(addressName);
      } catch (_err) {
        setSearchQuery("Current Location (GPS)");
        onAddressChange("Current Location (GPS)");
      } finally {
        setIsSearching(false);
      }
    }, () => {
      setIsSearching(false);
      alert("Unable to retrieve your location. Please check your browser permissions.");
    });
  };

  const handleSelectAddress = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setSelectedLocation({ lat, lng });
    setSearchQuery(result.display_name);
    setSearchResults([]);
    onAddressChange(result.display_name);
    if (onLocationSelected) onLocationSelected(lat, lng);
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
        // Fallback to Haversine distance (straight line * 1.3 urban routing factor)
        const distances = branchLocations.map(branch => {
          const rawDist = getDistanceFromLatLonInKm(selectedLocation.lat, selectedLocation.lng, branch.coords[1], branch.coords[0]);
          return { branch: branch.name, distanceKm: Number((rawDist * 1.3).toFixed(1)) };
        });
        const sorted = distances.sort((a, b) => a.distanceKm - b.distanceKm);
        onDistancesCalculated(sorted, "");
      } finally {
        onCalculating(false);
      }
    };

    calculateDistanceMatrix();
     
  }, [selectedLocation]);

  return (
    <div className="space-y-4">
      <div className="space-y-2 relative">
        <label className="text-sm font-bold text-foreground flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-foreground/50">Delivery Location *</span>
          <button 
            type="button" 
            onClick={() => setIsMapOpen(!isMapOpen)}
            className="text-[10px] text-[var(--brand-deep-rose)] font-bold uppercase tracking-widest bg-[var(--brand-deep-rose)]/10 px-3 py-1.5 rounded-md hover:bg-[var(--brand-deep-rose)]/20 transition-colors"
          >
            {isMapOpen ? "Close Map" : "Adjust on Map"}
          </button>
        </label>
        
        <div className="relative z-50 group">
          <Location className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--brand-deep-rose)] transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search society, building, or area..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-primary/30 bg-transparent focus:border-[var(--brand-deep-rose)] focus:ring-0 text-base font-serif transition-colors relative z-50 outline-none"
          />
          {isSearching && <Refresh2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        
        <button 
          type="button" 
          onClick={handleDetectLocation}
          className="flex items-center gap-2 text-[11px] font-sans font-bold text-[var(--brand-deep-rose)] hover:text-[var(--brand-deep-rose)]/80 transition-colors uppercase tracking-widest mt-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm0 0V3m0 18v-8M3 12h8m10 0h-8" />
          </svg>
          Detect my current location
        </button>

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
              if (onLocationSelected) onLocationSelected(pos.lat, pos.lng);
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
