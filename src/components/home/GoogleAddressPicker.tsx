"use client";

import { useEffect, useState, useRef, Component, ErrorInfo, ReactNode } from "react";
import { Refresh2, Location, SearchNormal } from "iconsax-react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

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

function PlacesAutocomplete({
  onPlaceSelect,
  value,
  onChange
}: {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  value: string;
  onChange: (val: string) => void;
}) {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const places = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!places) return;
    setAutocompleteService(new places.AutocompleteService());
    setPlacesService(new places.PlacesService(document.createElement('div')));
  }, [places]);

  useEffect(() => {
    if (!autocompleteService || !value.trim()) {
      setPredictions([]);
      return;
    }

    autocompleteService.getPlacePredictions({
      input: value,
      componentRestrictions: { country: "in" },
      // Optional: Bias to Vadodara bounds
      locationBias: {
        north: 22.45,
        south: 22.15,
        east: 73.35,
        west: 73.05
      }
    }, (results) => {
      setPredictions(results || []);
    });
  }, [value, autocompleteService]);

  const handleSelect = (placeId: string) => {
    if (!placesService) return;
    placesService.getDetails({
      placeId,
      fields: ['geometry', 'name', 'formatted_address']
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        onPlaceSelect(place);
        onChange(place?.formatted_address || place?.name || "");
        setPredictions([]);
      }
    });
  };

  return (
    <div className="relative z-50 group">
      <SearchNormal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[var(--brand-deep-rose)] transition-colors" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search society, building, or area..."
        className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-primary/30 bg-transparent focus:border-[var(--brand-deep-rose)] focus:ring-0 text-base font-serif transition-colors relative z-50 outline-none"
      />
      {predictions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p.place_id)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-secondary border-b border-border/50 last:border-0 transition-colors flex flex-col"
            >
              <span className="font-bold text-foreground">{p.structured_formatting.main_text}</span>
              <span className="text-xs text-muted-foreground">{p.structured_formatting.secondary_text}</span>
            </button>
          ))}
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA1j9ak9yeJsRfWA9vq5rQcDZvPayNCd2s";

  // Calculate Distances via Haversine
  useEffect(() => {
    if (!selectedLocation) return;
    props.onCalculating(true);

    // Fallback to Haversine distance (straight line * 1.3 urban routing factor)
    const distances = branchLocations.map(branch => {
      const rawDist = getDistanceFromLatLonInKm(selectedLocation.lat, selectedLocation.lng, branch.coords[1], branch.coords[0]);
      return { branch: branch.name, distanceKm: Number((rawDist * 1.3).toFixed(1)) };
    });
    const sorted = distances.sort((a, b) => a.distanceKm - b.distanceKm);
    props.onDistancesCalculated(sorted, "");
    props.onCalculating(false);
  }, [selectedLocation]);

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
      if (props.onLocationSelected) props.onLocationSelected(lat, lng);

      setSearchInputValue("Locating your exact address...");

      try {
        const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        const data = await response.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const addr = data.results[0].formatted_address;
          setSearchInputValue(addr);
          props.onAddressChange(addr);
        } else {
          console.error("Geocoding failed:", data);
          setSearchInputValue("Current Location (GPS)");
          props.onAddressChange("Current Location (GPS)");
          if (data.error_message) {
            alert("Google Maps Error: " + data.error_message + "\n\nPlease ensure the 'Geocoding API' is enabled in your Google Cloud Console.");
          }
        }
      } catch (err) {
        console.error("Geocoding fetch failed:", err);
        setSearchInputValue("Current Location (GPS)");
        props.onAddressChange("Current Location (GPS)");
      }
      setIsSearching(false);
    }, (err) => {
      setIsSearching(false);
      console.error("GPS Error:", err);
      alert("Unable to retrieve your location. Check your browser permissions or ensure location services are enabled on your device.");
    }, { timeout: 10000, enableHighAccuracy: true });
  };

  if (!API_KEY) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
        <strong>Google Maps API Key Missing</strong>
        <p>Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.</p>
      </div>
    );
  }

  return (
    <MapErrorBoundary fallback={
      <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm shadow-sm">
        <strong className="text-base block mb-2 text-orange-900">⚠️ Map Blocked By Browser Extension</strong>
        <p>Google Maps could not load because an extension in your browser (like an AdBlocker, Brave Shields, or Privacy Badger) blocked it.</p>
        <p className="mt-2 font-semibold">To fix this, please disable your adblocker for localhost and refresh the page.</p>
      </div>
    }>
      <APIProvider apiKey={API_KEY}>
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

            <Map
              defaultZoom={13}
              defaultCenter={{ lat: 22.3072, lng: 73.1812 }}
              disableDefaultUI={true}
              style={{ display: 'none' }}
            />

            <PlacesAutocomplete
              value={searchInputValue}
              onChange={(val) => {
                setSearchInputValue(val);
                props.onAddressChange(val);
              }}
              onPlaceSelect={(place) => {
                if (place?.geometry?.location) {
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  setSelectedLocation({ lat, lng });
                  const addr = place.formatted_address || place.name || "";
                  setSearchInputValue(addr);
                  props.onAddressChange(addr);
                  if (props.onLocationSelected) props.onLocationSelected(lat, lng);
                }
              }}
            />

            <button
              type="button"
              onClick={handleDetectLocation}
              className="flex items-center gap-2 text-[11px] font-sans font-bold text-[var(--brand-deep-rose)] hover:text-[var(--brand-deep-rose)]/80 transition-colors uppercase tracking-widest mt-1"
            >
              {isSearching ? <Refresh2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm0 0V3m0 18v-8M3 12h8m10 0h-8" />
                </svg>
              )}
              Detect my current location
            </button>
          </div>

          {isMapOpen && (
            <InnerMap
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              onAddressChange={props.onAddressChange}
              onLocationSelected={props.onLocationSelected}
            />
          )}
        </div>
      </APIProvider>
    </MapErrorBoundary>
  );
}
