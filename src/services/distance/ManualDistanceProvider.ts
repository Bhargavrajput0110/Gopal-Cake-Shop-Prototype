import { DistanceProvider, DistanceResult } from './DistanceProvider';

export class ManualDistanceProvider implements DistanceProvider {
  async calculateDistance(origin: string, destination: string): Promise<DistanceResult> {
    // In production without Google Maps, we can either:
    // 1. Return a standard fixed fallback.
    // 2. Allow manual override from the frontend (which bypasses this).
    // For now, we return a fallback assumption to prevent blocking the checkout.
    
    console.warn(`[ManualDistanceProvider] Calculating distance fallback for Origin: ${origin} to Destination: ${destination}`);
    
    return {
      distanceKm: 5.0,
      durationMinutes: 15,
      isFarDistance: false,
    };
  }
}
