"use client";

import { useEffect, useState, useRef, Component, ErrorInfo, ReactNode } from "react";
import { Refresh2, Location, SearchNormal, TickCircle } from "iconsax-react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";

class MapErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Map Error caught by boundary:", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// The 4 Branches of Gopal Bakery [lng, lat] for Haversine
const branchLocations = [
  { name: "Khanderao Market", coords: [73.1931, 22.2982] },
  { name: "Uma Char Rasta", coords: [73.1593, 22.3168] },
  { name: "Factory Warashiya", coords: [73.1593, 22.3168] }, // Matches Uma as requested
  { name: "Ellora Park", coords: [73.1613, 22.3188] }
];

type DistanceResult = { branch: string; distanceKm: number };

// Haversine distance formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

interface GoogleAddressPickerProps {
  onDistancesCalculated: (distances: DistanceResult[], error: string) => void;
  onAddressChange: (address: string) => void;
  onCalculating: (isCalculating: boolean) => void;
  onLocationSelected?: (lat: number, lng: number) => void;
}

async function performSmartAddressSearch(query: string): Promise<any[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  try {
    const apiRes = await fetch(`/api/v1/address-search?q=${encodeURIComponent(q)}`).catch(() => null);
    if (apiRes && apiRes.ok) {
      const apiData = await apiRes.json().catch(() => null);
      if (apiData && Array.isArray(apiData.results)) {
        return apiData.results;
      }
    }
  } catch (_e) {}

  return [];
}

function PlacesAutocomplete({
  value,
  onChange,
  onSelectAddress
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectAddress: (item: any) => void;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchRes = await performSmartAddressSearch(value);
        setResults(searchRes);
      } catch (_e) {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [value]);

  const handleItemClick = (item: any) => {
    onSelectAddress(item);
    setIsOpen(false);
  };

  const handleUseTypedText = () => {
    onSelectAddress({
      name: value,
      display_name: `${value}, Vadodara`,
      lat: 22.3072,
      lon: 73.1812,
    });
    setIsOpen(false);
  };

  const showMenu = isOpen && value.trim().length >= 2;

  return (
    <div className="relative z-[200] group">
      <SearchNormal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--brand-deep-rose)] transition-colors z-[51]" />
      <input
        type="text"
        value={value}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setIsOpen(true);
          onChange(e.target.value);
        }}
        placeholder="Search society, building, street, or area..."
        className="w-full pl-11 pr-10 py-3.5 rounded-xl border-2 border-primary/30 bg-white focus:border-[var(--brand-deep-rose)] focus:ring-0 text-base font-serif transition-colors relative z-[200] outline-none text-foreground placeholder:text-muted-foreground shadow-sm"
      />
      {isSearching && (
        <Refresh2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--brand-deep-rose)] z-[201]" />
      )}

      {showMenu && (
        <div className="absolute z-[300] w-full mt-1 bg-white border border-border/80 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-border/40">
          
          {/* 1-Tap Option: Use exact typed text as location */}
          <button
            type="button"
            onClick={handleUseTypedText}
            className="w-full text-left px-4 py-3 text-sm bg-rose-50/90 hover:bg-rose-100 transition-colors flex items-center justify-between group cursor-pointer border-b border-rose-200"
          >
            <div className="flex flex-col">
              <span className="font-bold text-[var(--brand-deep-rose)] text-xs uppercase tracking-wider">
                ✨ Use as Delivery Location
              </span>
              <span className="font-serif font-bold text-foreground line-clamp-1">
                "{value}"
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-[var(--brand-deep-rose)] text-white px-2 py-1 rounded-md shrink-0">
              Select
            </span>
          </button>

          {isSearching && results.length === 0 && (
            <div className="p-4 text-xs text-muted-foreground font-serif flex items-center justify-center gap-2">
              <Refresh2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-deep-rose)]" />
              Searching matching locations in Vadodara...
            </div>
          )}

          {results.map((item, idx) => {
            const mainText = item.name || item.display_name.split(',')[0];
            const secText = item.display_name;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleItemClick(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-rose-50/80 transition-colors flex flex-col group cursor-pointer"
              >
                <span className="font-bold text-foreground group-hover:text-[var(--brand-deep-rose)] flex items-center gap-1.5">
                  📍 {mainText}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-1">{secText}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InnerMap({
  selectedLocation,
  setSelectedLocation,
  onAddressChange,
  onLocationSelected
}: {
  selectedLocation: { lat: number, lng: number } | null;
  setSelectedLocation: (pos: { lat: number, lng: number }) => void;
  onAddressChange: (addr: string) => void;
  onLocationSelected?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo(selectedLocation);
    }
  }, [map, selectedLocation]);

  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setSelectedLocation({ lat, lng });
      onAddressChange("Custom Pinned Location");
      if (onLocationSelected) onLocationSelected(lat, lng);
    } else if (e.latLng) {
      const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
      const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
      setSelectedLocation({ lat, lng });
      onAddressChange("Custom Pinned Location");
      if (onLocationSelected) onLocationSelected(lat, lng);
    }
  };

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border shadow-inner relative z-0 mt-4">
      <Map
        defaultZoom={13}
        defaultCenter={{ lat: 22.3072, lng: 73.1812 }}
        onClick={handleMapClick}
        disableDefaultUI={true}
        zoomControl={true}
        mapId="DEMO_MAP_ID"
      >
        {selectedLocation && (
          <AdvancedMarker position={selectedLocation}>
            <Pin background={"#e11d48"} borderColor={"#be123c"} glyphColor={"#fff"} />
          </AdvancedMarker>
        )}
      </Map>
      <div className="absolute top-2 left-2 right-2 bg-secondary/90 backdrop-blur-sm p-2 rounded-lg text-center text-xs text-foreground font-medium shadow-md pointer-events-none z-[1000]">
        Click anywhere on the map to fine-tune your exact location.
      </div>
    </div>
  );
}

export function GoogleAddressPicker(props: GoogleAddressPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA1j9ak9yeJsRfWA9vq5rQcDZvPayNCd2s";

  // Calculate Distances via Haversine
  useEffect(() => {
    if (!selectedLocation) return;
    props.onCalculating(true);

    const distances = branchLocations.map(branch => {
      const rawDist = getDistanceFromLatLonInKm(selectedLocation.lat, selectedLocation.lng, branch.coords[1], branch.coords[0]);
      return { branch: branch.name, distanceKm: Number((rawDist * 1.3).toFixed(1)) };
    });
    const sorted = distances.sort((a, b) => a.distanceKm - b.distanceKm);
    props.onDistancesCalculated(sorted, "");
    props.onCalculating(false);
  }, [selectedLocation]);

  const handleSelectAddress = (item: any) => {
    const latNum = parseFloat(item.lat);
    const lngNum = parseFloat(item.lon);
    setSelectedLocation({ lat: latNum, lng: lngNum });
    setSearchInputValue(item.display_name);
    props.onAddressChange(item.display_name);
    if (props.onLocationSelected) props.onLocationSelected(latNum, lngNum);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setSelectedLocation({ lat, lng });
      if (props.onLocationSelected) props.onLocationSelected(lat, lng);

      setSearchInputValue("Locating your exact address...");

      let foundAddr = false;
      try {
        const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        const data = await response.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const addr = data.results[0].formatted_address;
          setSearchInputValue(addr);
          props.onAddressChange(addr);
          foundAddr = true;
        }
      } catch (err) {
        console.error("Google Geocoding fetch failed:", err);
      }

      if (!foundAddr) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data.display_name) {
            setSearchInputValue(data.display_name);
            props.onAddressChange(data.display_name);
            foundAddr = true;
          }
        } catch (_e) {}
      }

      if (!foundAddr) {
        setSearchInputValue("Current Location (GPS)");
        props.onAddressChange("Current Location (GPS)");
      }
      setIsDetecting(false);
    }, (err) => {
      setIsDetecting(false);
      console.error("GPS Error:", err);
      alert("Unable to retrieve location. Check your browser permissions.");
    }, { timeout: 10000, enableHighAccuracy: true });
  };

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

        {/* 100% Standalone Autocomplete Input & Recommendation Menu */}
        <PlacesAutocomplete
          value={searchInputValue}
          onChange={(val) => {
            setSearchInputValue(val);
            props.onAddressChange(val);
          }}
          onSelectAddress={handleSelectAddress}
        />

        <button
          type="button"
          onClick={handleDetectLocation}
          className="flex items-center gap-2 text-[11px] font-sans font-bold text-[var(--brand-deep-rose)] hover:text-[var(--brand-deep-rose)]/80 transition-colors uppercase tracking-widest mt-1 cursor-pointer"
        >
          {isDetecting ? <Refresh2 className="w-4 h-4 animate-spin" /> : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm0 0V3m0 18v-8M3 12h8m10 0h-8" />
            </svg>
          )}
          Detect my current location
        </button>
      </div>

      {isMapOpen && (
        <MapErrorBoundary fallback={
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-xs">
            Map preview restricted by browser extension. Address search above is fully active.
          </div>
        }>
          <APIProvider apiKey={API_KEY}>
            <InnerMap
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              onAddressChange={props.onAddressChange}
              onLocationSelected={props.onLocationSelected}
            />
          </APIProvider>
        </MapErrorBoundary>
      )}
    </div>
  );
}
