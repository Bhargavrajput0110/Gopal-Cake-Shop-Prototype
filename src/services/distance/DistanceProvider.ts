export interface DistanceResult {
  distanceKm: number;
  durationMinutes?: number;
  isFarDistance: boolean;
}

export interface DistanceProvider {
  /**
   * Calculates the distance and duration between an origin and destination.
   * @param origin The starting address or coordinates (e.g., Branch address)
   * @param destination The target address or coordinates (e.g., Customer delivery address)
   */
  calculateDistance(origin: string, destination: string): Promise<DistanceResult>;
}
