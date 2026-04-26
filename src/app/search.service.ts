import { Injectable, signal } from '@angular/core';

export interface City {
  name: string;
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  searchQuery = signal('');

  /**
   * Filter cities berdasarkan search query
   * @param cities Array of cities untuk di-filter
   * @param query Search query string
   * @returns Filtered cities array
   */
  filterCities(cities: City[], query: string): City[] {
  if (!query.trim()) {
    return cities;
  }

  const lowerQuery = query.toLowerCase().trim();

  return cities
    .filter(city =>
      city.name.toLowerCase().includes(lowerQuery)
    )
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
