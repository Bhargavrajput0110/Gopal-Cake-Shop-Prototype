"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon in Next.js
if (typeof window !== "undefined") {
  // @ts-expect-error - Next.js leaflet default icon fix
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const shopIcon = typeof window !== "undefined" ? new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

import { useEffect } from "react";
import { Popup } from "react-leaflet";

const branchLocations = [
  { name: "Uma Branch (Main)", coords: [22.3025, 73.2185] },
  { name: "Khanderao Branch", coords: [22.29745, 73.20194] },
  { name: "Warashiya Factory", coords: [22.3245, 73.2115] },
  { name: "Ellora Park Branch", coords: [22.3182, 73.1610] }
];

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15, { animate: true });
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapController({ position }: { position: L.LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true });
    }
  }, [map, position]);
  return null;
}

export default function LeafletMapInner({ 
  position, 
  setPosition 
}: { 
  position: {lat: number, lng: number} | null, 
  setPosition: (pos: {lat: number, lng: number}) => void 
}) {
  
  // Convert standard object to Leaflet LatLng for internal use
  const leafletPos = position ? new L.LatLng(position.lat, position.lng) : null;

  return (
    <MapContainer 
      center={leafletPos || [22.3072, 73.1812]} // Default to Vadodara
      zoom={leafletPos ? 15 : 13} 
      scrollWheelZoom={true} 
      style={{ height: '300px', minHeight: '300px', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController position={leafletPos} />
      
      {/* Render the shop branches on the map using the gold icon */}
      {shopIcon && branchLocations.map((branch, idx) => (
        <Marker key={idx} position={[branch.coords[0], branch.coords[1]]} icon={shopIcon}>
          <Popup>
            <div className="font-bold text-[var(--brand-deep-rose)] text-sm">{branch.name}</div>
            <div className="text-xs">Gopal Cake Shop</div>
          </Popup>
        </Marker>
      ))}

      <LocationMarker 
        position={leafletPos} 
        setPosition={(p) => setPosition({ lat: p.lat, lng: p.lng })} 
      />
    </MapContainer>
  );
}
