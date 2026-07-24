import { DistanceProvider, DistanceResult } from './DistanceProvider';

export class GoogleMapsDistanceProvider implements DistanceProvider {
  async calculateDistance(origin: string, destination: string): Promise<DistanceResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is missing. Configure it or use DISTANCE_PROVIDER=manual.");
    }

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origin);
    url.searchParams.append('destinations', destination);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || ''}`);
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`Google Maps could not route from origin to destination.`);
    }

    const distanceKm = Number((element.distance.value / 1000).toFixed(1));
    const durationMinutes = Math.round(element.duration.value / 60);

    return {
      distanceKm,
      durationMinutes,
      isFarDistance: distanceKm > 20, // 20KM far distance rule
    };
  }
}
