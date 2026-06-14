"use client";

import { useEffect, useState, useRef } from "react";
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMapsLibrary, 
  useMap 
} from "@vis.gl/react-google-maps";
import { Loader2, MapPin } from "lucide-react";

// The 4 Branches of Gopal Bakery
const branchLocations = [
  { name: "Khanderao Market", coords: { lat: 22.2982, lng: 73.1931 } },
  { name: "Uma Char Rasta", coords: { lat: 22.3168, lng: 73.1593 } },
  { name: "Factory Warashiya", coords: { lat: 22.3218, lng: 73.2100 } },
  { name: "Ellora Park", coords: { lat: 22.3188, lng: 73.1613 } }
];

type DistanceResult = { branch: string; distanceKm: number };

interface GoogleAddressPickerProps {
  onDistancesCalculated: (distances: DistanceResult[], error: string) => void;
  onAddressChange: (address: string) => void;
  onCalculating: (isCalculating: boolean) => void;
}

// Inner component where Google Maps hooks are safe to use
function MapInner({ onDistancesCalculated, onAddressChange, onCalculating }: GoogleAddressPickerProps) {
  const map = useMap();
  const placesLibrary = useMapsLibrary("places");
  const routesLibrary = useMapsLibrary("routes");

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Initialize Autocomplete
  useEffect(() => {
    if (!placesLibrary || !inputRef.current) return;
    const ac = new placesLibrary.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["geometry", "formatted_address"]
    });
    setAutocomplete(ac);
  }, [placesLibrary]);

  // Handle Autocomplete Place Selection
  useEffect(() => {
    if (!autocomplete) return;
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location && place.formatted_address) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedLocation({ lat, lng });
        setFormattedAddress(place.formatted_address);
        onAddressChange(place.formatted_address);
        if (map) map.panTo({ lat, lng });
      }
    });
  }, [autocomplete, map, onAddressChange]);

  // Calculate Distances whenever Location Changes
  useEffect(() => {
    if (!selectedLocation || !routesLibrary) return;
    
    const calculateDistanceMatrix = async () => {
      onCalculating(true);
      const service = new routesLibrary.DistanceMatrixService();
      
      try {
        const response = await service.getDistanceMatrix({
          origins: [selectedLocation],
          destinations: branchLocations.map(b => b.coords),
          travelMode: google.maps.TravelMode.DRIVING,
        });

        if (response.rows[0].elements) {
          const results = response.rows[0].elements.map((element, index) => {
            if (element.status === "OK") {
              const distanceKm = Number((element.distance.value / 1000).toFixed(1));
              return { branch: branchLocations[index].name, distanceKm };
            }
            return { branch: branchLocations[index].name, distanceKm: 999 };
          });

          const sorted = results.sort((a, b) => a.distanceKm - b.distanceKm);
          onDistancesCalculated(sorted, "");
        }
      } catch (err) {
        onDistancesCalculated([], "Failed to calculate distances. Please try again.");
      } finally {
        onCalculating(false);
      }
    };

    calculateDistanceMatrix();
  }, [selectedLocation, routesLibrary, onDistancesCalculated, onCalculating]);

  // Handle manual map click
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
      // Optionally reverse geocode here, but for now we just update coordinates
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
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
        
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Start typing your society or building name..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-card focus:ring-2 focus:ring-primary/50 text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground italic">Powered by Google Maps Auto-complete</p>
      </div>

      {isMapOpen && (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border shadow-inner">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={selectedLocation || { lat: 22.3072, lng: 73.1812 }} // Default Vadodara
            defaultZoom={selectedLocation ? 15 : 12}
            gestureHandling="greedy"
            disableDefaultUI={true}
            onClick={handleMapClick}
          >
            {selectedLocation && (
              <AdvancedMarker position={selectedLocation}>
                <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow-xl transform -translate-y-4">
                  <MapPin className="w-5 h-5" />
                </div>
              </AdvancedMarker>
            )}
          </Map>
          <div className="bg-secondary p-2 text-center text-xs text-muted-foreground">
            Click anywhere on the map to pin your exact location.
          </div>
        </div>
      )}
    </div>
  );
}

export function GoogleAddressPicker(props: GoogleAddressPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  if (!apiKey) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-xl text-sm text-destructive">
        <p className="font-bold">Google Maps API Key Missing!</p>
        <p>Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file to enable the interactive map and precise location tracking.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapInner {...props} />
    </APIProvider>
  );
}
