import { DistanceProvider } from './DistanceProvider';
import { GoogleMapsDistanceProvider } from './GoogleMapsDistanceProvider';
import { ManualDistanceProvider } from './ManualDistanceProvider';

export class DistanceFactory {
  static getProvider(): DistanceProvider {
    const provider = process.env.DISTANCE_PROVIDER?.toLowerCase() || 'manual';

    switch (provider) {
      case 'google':
        return new GoogleMapsDistanceProvider();
      case 'manual':
      default:
        return new ManualDistanceProvider();
    }
  }
}
