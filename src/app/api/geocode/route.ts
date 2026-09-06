import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA1j9ak9yeJsRfWA9vq5rQcDZvPayNCd2s";

    if (!lat || !lng) {
      return NextResponse.json({ status: "ERROR", error_message: "Missing coordinates" });
    }

    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return NextResponse.json({ status: "ERROR", error_message: "Internal server error connecting to Google Maps." });
  }
}
