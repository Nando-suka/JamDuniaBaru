import { Injectable, signal, computed, inject } from '@angular/core';
import { SearchService, City } from './search.service';
import { FavoritesService } from './favorites.service';
import { effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClockFacade {
  private searchService = inject(SearchService);
  private favoritesService = inject(FavoritesService);

  // ===== STATE =====
  itemsToShow = signal(12);
  isLoading = signal(false);
  showFavoritesOnly = signal(false);

  // ===== VIEW MODE STATE =====
  viewMode = signal<'list' | 'grid' | 'compact'>('list');
  animationEnabled = signal(true);

  // Animation states
  recentlyAdded = signal<string | null>(null);
  recentlyRemoved = signal<string | null>(null);
  recentlyToggledTheme = signal(false);

  // ===== DATA SOURCE =====
  private locations: City[] = [
    { name: 'Honolulu', offset: -10, lat: 21.3069, lon: -157.8583 }, // Hawaii, AS
    { name: 'Anchorage', offset: -9, lat: 61.2181, lon: -149.9003 }, // Alaska, AS
    { name: 'Los Angeles', offset: -8, lat: 34.0522, lon: -118.2437 }, // Pantai Barat AS (PST)
    { name: 'Denver', offset: -7, lat: 39.7392, lon: -104.9903 }, // Pegunungan AS (MST)
    { name: 'Chicago', offset: -6, lat: 41.8781, lon: -87.6298 }, // Tengah AS (CST)
    { name: 'Mexico City', offset: -6, lat: 19.4326, lon: -99.1332 }, // Meksiko
    { name: 'New York', offset: -5, lat: 40.7128, lon: -74.0060 }, // Pantai Timur AS (EST)
    { name: 'Toronto', offset: -5, lat: 43.6532, lon: -79.3832 }, // Kanada
    { name: 'Santiago', offset: -4, lat: -33.4489, lon: -70.6693 }, // Chile
    { name: 'Sao Paulo', offset: -3, lat: -23.5505, lon: -46.6333 }, // Brasil
    { name: 'Buenos Aires', offset: -3, lat: -34.6037, lon: -58.3816 }, // Argentina

    // --- EROPA & AFRIKA (Garis Tengah) ---
    { name: 'Reykjavik', offset: 0, lat: 64.1466, lon: -21.9426 }, // Islandia
    { name: 'London', offset: 0, lat: 51.5074, lon: -0.1278 }, // Inggris (GMT)
    { name: 'Casablanca', offset: 1, lat: 33.5731, lon: -7.5898 }, // Maroko
    { name: 'Paris', offset: 1, lat: 48.8566, lon: 2.3522 }, // Prancis (CET)
    { name: 'Berlin', offset: 1, lat: 52.5200, lon: 13.4050 }, // Jerman (CET)
    { name: 'Rome', offset: 1, lat: 41.9028, lon: 12.4964 }, // Italia (CET)
    { name: 'Lagos', offset: 1, lat: 6.5244, lon: 3.3792 }, // Nigeria
    { name: 'Cape Town', offset: 2, lat: -33.9249, lon: 18.4241 }, // Afrika Selatan
    { name: 'Cairo', offset: 2, lat: 30.0444, lon: 31.2357 }, // Mesir
    { name: 'Athens', offset: 2, lat: 37.9838, lon: 23.7275 }, // Yunani
    { name: 'Istanbul', offset: 3, lat: 41.0082, lon: 28.9784 }, // Turki
    { name: 'Moscow', offset: 3, lat: 55.7558, lon: 37.6173 }, // Rusia
    { name: 'Riyadh', offset: 3, lat: 24.7136, lon: 46.6753 }, // Arab Saudi
    { name: 'Nairobi', offset: 3, lat: -1.2921, lon: 36.8219 }, // Kenya
    { name: 'Betlehem', offset: 5, lat: 31.7054, lon: 35.2024 }, // Israel

    // --- ASIA & TIMUR TENGAH ---
    { name: 'Dubai', offset: 4, lat: 25.2048, lon: 55.2708 }, // Uni Emirat Arab
    { name: 'Tehran', offset: 3.5, lat: 35.6892, lon: 51.3890 }, // Iran
    { name: 'Jerusalem', offset: 3, lat: 31.7683, lon: 35.2137 }, // Israel
    { name: 'Karachi', offset: 5, lat: 24.8607, lon: 67.0011 }, // Pakistan
    { name: 'Mumbai', offset: 5.5, lat: 19.0760, lon: 72.8777 }, // India
    { name: 'Kathmandu', offset: 5.75, lat: 27.7172, lon: 85.3240 }, // Nepal (Offset unik!)
    { name: 'Manama', offset: 6, lat: 26.2235, lon: 50.5876 }, // Bahrain
    { name: 'Dhaka', offset: 6, lat: 23.8103, lon: 90.4125 }, // Bangladesh
    { name: 'Bangkok', offset: 7, lat: 13.7563, lon: 100.5018 }, // Thailand
    { name: 'Medan', offset: 7, lat: 3.5952, lon: 98.6722 }, // Indonesia (WIB)
    { name: 'Jakarta', offset: 7, lat: -6.2088, lon: 106.8456 }, // Indonesia (WIB)
    { name: 'Singapore', offset: 8, lat: 1.3521, lon: 103.8198 }, // Singapura
    { name: 'Kuala Lumpur', offset: 8, lat: 3.1390, lon: 101.6869 }, // Malaysia
    { name: 'Hong Kong', offset: 8, lat: 22.3193, lon: 114.1694 }, // Hong Kong
    { name: 'Beijing', offset: 8, lat: 39.9042, lon: 116.4074 }, // China
    { name: 'Chongqing', offset: 8, lat: 29.4316, lon: 106.9123 }, // China
    { name: 'Bali', offset: 8, lat: -8.3405, lon: 115.0920 }, // Indonesia (WITA)
    { name: 'Tanjung Selor', offset: 8, lat: 2.8032, lon: 117.3839 }, // Indonesia (WITA)
    { name: 'Perth', offset: 8, lat: -31.9505, lon: 115.8605 }, // Australia Barat
    { name: 'Tokyo', offset: 9, lat: 35.6895, lon: 139.6917 },
    { name: 'Osaka', offset: 9, lat: 34.6937, lon: 135.5023 },
    { name: 'Kyoto', offset: 9, lat: 35.0116, lon: 135.7681 }, // Jepang
    { name: 'Seoul', offset: 9, lat: 37.5665, lon: 126.9780 }, // Korea Selatan
    { name: 'Jayapura', offset: 9, lat: -2.5339, lon: 140.7181 }, // Indonesia (WIT)
    { name: 'Adelaide', offset: 9.5, lat: -34.9285, lon: 138.6007 }, // Australia Tengah

    // --- PASIFIK & AUSTRALIA ---
    { name: 'Sydney', offset: 10, lat: -33.8688, lon: 151.2093 }, // Australia Timur
    { name: 'Guam', offset: 10, lat: 13.4443, lon: 144.7937 }, // Teritori AS
    { name: 'Auckland', offset: 12, lat: -36.8485, lon: 174.7633 }, // Selandia Baru
    { name: 'Fiji', offset: 12, lat: -17.7134, lon: 178.0650 }, // Fiji
  ];

  // ===== COMPUTED =====
  filteredLocations = computed(() => {
    let data = this.locations;

    if (this.showFavoritesOnly()) {
      data = data.filter((loc) => this.favoritesService.isFavorite(loc));
    }

    return this.searchService.filterCities(data, this.searchService.searchQuery());
  });

  /** Locations for analog clock view (excludes Honolulu) */
  analogLocations = computed(() => {
    return this.filteredLocations().filter(loc => loc.name !== 'Honolulu');
  });

  isAllLoaded = computed(() => {
    return (
      !this.searchService.searchQuery() &&
      this.itemsToShow() >= this.filteredLocations().length &&
      this.filteredLocations().length > 0
    );
  });

  // ===== ACTIONS =====
  loadMore() {
    this.isLoading.set(true);

    setTimeout(() => {
      this.itemsToShow.update((v) => v + 12);
      this.isLoading.set(false);
    }, 1000);
  }

  toggleFavoritesOnly() {
    this.showFavoritesOnly.update((v) => !v);
    this.itemsToShow.set(12);
    this.searchService.clearSearch();
  }

  resetPagination() {
    this.itemsToShow.set(12);
  }

  getFavoritesCount() {
    return this.favoritesService.getFavoritesCount();
  }

  // Get all locations (raw array) for timezone converter
  getAllLocations(): City[] {
    return this.locations;
  }

  isFavorite(city: City) {
    return this.favoritesService.isFavorite(city);
  }

  toggleFavorite(city: City) {
    this.favoritesService.toggleFavorite(city);
  }

  // ===== VIEW MODE ACTIONS =====
  getViewMode() {
    return this.viewMode;
  }

  setViewMode(mode: 'list' | 'grid' | 'compact'): void {
    this.viewMode.set(mode);
    this.saveViewModeToStorage(mode);
  }

  toggleAnimation(): void {
    this.animationEnabled.update((v) => !v);
  }

  isAnimationEnabled(): boolean {
    return this.animationEnabled();
  }

  // Animation triggers
  triggerAddAnimation(cityName: string): void {
    this.recentlyAdded.set(cityName);
    setTimeout(() => this.recentlyAdded.set(null), 1000);
  }

  triggerRemoveAnimation(cityName: string): void {
    this.recentlyRemoved.set(cityName);
    setTimeout(() => this.recentlyRemoved.set(null), 1000);
  }

  triggerThemeAnimation(): void {
    this.recentlyToggledTheme.set(true);
    setTimeout(() => this.recentlyToggledTheme.set(false), 500);
  }

  getRecentlyAdded() {
    return this.recentlyAdded;
  }

  getRecentlyRemoved() {
    return this.recentlyRemoved;
  }

  getRecentlyToggledTheme() {
    return this.recentlyToggledTheme;
  }

  private saveViewModeToStorage(mode: 'list' | 'grid' | 'compact'): void {
    try {
      localStorage.setItem('jam-dunia-view-mode', mode);
    } catch (e) {
      console.error('Error saving view mode:', e);
    }
  }

  private getStoredViewMode(): 'list' | 'grid' | 'compact' {
    try {
      const stored = localStorage.getItem('jam-dunia-view-mode');
      if (stored === 'list' || stored === 'grid' || stored === 'compact') {
        return stored;
      }
    } catch (e) {
      console.error('Error loading view mode:', e);
    }
    return 'list';
  }

  // ===== INIT =====
  constructor() {
    this.viewMode.set(this.getStoredViewMode());
  }
}
