import { DistanceProvider, DistanceResult } from './DistanceProvider';

export class ManualDistanceProvider implements DistanceProvider {
  async calculateDistance(origin: string, destination: string): Promise<DistanceResult> {
    // No real distance data available without Google Maps.
    // Throw so the caller (StorefrontEngine) falls back to the flat
    // DELIVERY_CHARGE setting rather than applying tiered pricing on a
    // fake distance value.
    console.warn(`[ManualDistanceProvider] No distance provider configured. ` +
      `Set DISTANCE_PROVIDER=google and GOOGLE_MAPS_API_KEY to enable tiered delivery pricing. ` +
      `Origin: ${origin} | Destination: ${destination}`);

    throw new Error('Distance calculation is not available without a configured provider. ' +
      'Set DISTANCE_PROVIDER=google to enable distance-based delivery charges.');
  }
}
