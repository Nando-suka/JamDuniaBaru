import { Injectable, signal } from '@angular/core';

export interface City {
  name: string;
  offset: number;
  lat: number;
  lon: number;
  timeZone?: string;
}

const CITY_TIME_ZONES: Record<string, string> = {
  Honolulu: 'Pacific/Honolulu',
  Anchorage: 'America/Anchorage',
  'Los Angeles': 'America/Los_Angeles',
  Denver: 'America/Denver',
  Chicago: 'America/Chicago',
  'Mexico City': 'America/Mexico_City',
  'New York': 'America/New_York',
  Toronto: 'America/Toronto',
  Santiago: 'America/Santiago',
  'Sao Paulo': 'America/Sao_Paulo',
  'Buenos Aires': 'America/Argentina/Buenos_Aires',
  Reykjavik: 'Atlantic/Reykjavik',
  London: 'Europe/London',
  Casablanca: 'Africa/Casablanca',
  Paris: 'Europe/Paris',
  Berlin: 'Europe/Berlin',
  Rome: 'Europe/Rome',
  Lagos: 'Africa/Lagos',
  'Cape Town': 'Africa/Johannesburg',
  Cairo: 'Africa/Cairo',
  Athens: 'Europe/Athens',
  Istanbul: 'Europe/Istanbul',
  Moscow: 'Europe/Moscow',
  Riyadh: 'Asia/Riyadh',
  Nairobi: 'Africa/Nairobi',
  Betlehem: 'Asia/Jerusalem',
  Dubai: 'Asia/Dubai',
  Tehran: 'Asia/Tehran',
  Jerusalem: 'Asia/Jerusalem',
  Karachi: 'Asia/Karachi',
  Mumbai: 'Asia/Kolkata',
  Kathmandu: 'Asia/Kathmandu',
  Manama: 'Asia/Bahrain',
  Dhaka: 'Asia/Dhaka',
  Bangkok: 'Asia/Bangkok',
  Medan: 'Asia/Jakarta',
  Jakarta: 'Asia/Jakarta',
  Singapore: 'Asia/Singapore',
  'Kuala Lumpur': 'Asia/Kuala_Lumpur',
  'Hong Kong': 'Asia/Hong_Kong',
  Beijing: 'Asia/Shanghai',
  Chongqing: 'Asia/Shanghai',
  Bali: 'Asia/Makassar',
  'Tanjung Selor': 'Asia/Makassar',
  Perth: 'Australia/Perth',
  Tokyo: 'Asia/Tokyo',
  Osaka: 'Asia/Tokyo',
  Kyoto: 'Asia/Tokyo',
  Seoul: 'Asia/Seoul',
  Jayapura: 'Asia/Jayapura',
  Adelaide: 'Australia/Adelaide',
  Sydney: 'Australia/Sydney',
  Guam: 'Pacific/Guam',
  Auckland: 'Pacific/Auckland',
  Fiji: 'Pacific/Fiji',
};

export function getCityTimeZone(city: City): string {
  return city.timeZone ?? CITY_TIME_ZONES[city.name] ?? 'UTC';
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  searchQuery = signal('');

  /**
   * Filter cities berdasarkan search query
   * @param cities Array of cities untuk di-filter
   * @param query Search query string
   * @returns Filtered cities array
   */

  // filter cities and make it searchable and don't forget the string is needed.
  filterCities(cities: City[], query: string): City[] {
    if (!query.trim()) {
      return cities;
    }

    const lowerQuery = query.toLowerCase().trim();

    return cities
      .filter((city) => city.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Update search query
   * @param query Search string
   */
  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery.set('');
  }
}
