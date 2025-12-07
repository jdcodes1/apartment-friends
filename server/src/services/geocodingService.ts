import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

export class GeocodingService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Geocode an address to latitude/longitude coordinates
   */
  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zipCode: string
  ): Promise<GeocodingResult | null> {
    try {
      // If no API key, return null (geocoding optional)
      if (!this.apiKey) {
        console.warn('Google Maps API key not configured. Skipping geocoding.');
        return null;
      }

      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      const url = 'https://maps.googleapis.com/maps/api/geocode/json';

      const response = await axios.get(url, {
        params: {
          address: fullAddress,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const { lat, lng } = result.geometry.location;

        return {
          latitude: lat,
          longitude: lng,
          formattedAddress: result.formatted_address,
        };
      }

      console.warn('Geocoding failed:', response.data.status);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      if (!this.apiKey) {
        console.warn('Google Maps API key not configured. Skipping reverse geocoding.');
        return null;
      }

      const url = 'https://maps.googleapis.com/maps/api/geocode/json';

      const response = await axios.get(url, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
