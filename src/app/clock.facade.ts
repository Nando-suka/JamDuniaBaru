import { Injectable, signal, computed, inject } from '@angular/core';
import { SearchService, City, getCityTimeZone } from './search.service';
import { FavoritesService } from './favorites.service';

@Injectable({ providedIn: 'root' })
export class ClockPaginationService {
  readonly itemsToShow = signal(12);
  readonly isLoading = signal(false);

  loadMore(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.itemsToShow.update((v) => v + 12);
      this.isLoading.set(false);
    }, 1000);
  }

  reset(): void {
    this.itemsToShow.set(12);
  }
}

@Injectable({ providedIn: 'root' })
export class ClockViewPreferencesService {
  private readonly STORAGE_KEY = 'jam-dunia-view-mode';

  readonly viewMode = signal<'list' | 'grid' | 'compact'>('list');
  readonly animationEnabled = signal(true);
  readonly recentlyAdded = signal<string | null>(null);
  readonly recentlyRemoved = signal<string | null>(null);
  readonly recentlyToggledTheme = signal(false);

  constructor() {
    this.viewMode.set(this.getStoredViewMode());
  }

  setViewMode(mode: 'list' | 'grid' | 'compact'): void {
    this.viewMode.set(mode);
    this.saveViewModeToStorage(mode);
  }

  toggleAnimation(): void {
    this.animationEnabled.update((v) => !v);
  }

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

  private saveViewModeToStorage(mode: 'list' | 'grid' | 'compact'): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, mode);
    } catch (e) {
      console.error('Error saving view mode:', e);
    }
  }

  private getStoredViewMode(): 'list' | 'grid' | 'compact' {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'list' || stored === 'grid' || stored === 'compact') {
        return stored;
      }
    } catch (e) {
      console.error('Error loading view mode:', e);
    }
    return 'list';
  }
}

@Injectable({ providedIn: 'root' })
export class ClockFacade {
  private searchService = inject(SearchService);
  private favoritesService = inject(FavoritesService);
  private pagination = inject(ClockPaginationService);
  private viewPrefs = inject(ClockViewPreferencesService);

  // ===== STATE (delegated for compatibility) =====
  readonly itemsToShow = this.pagination.itemsToShow;
  readonly isLoading = this.pagination.isLoading;
  readonly showFavoritesOnly = signal(false);

  // ===== VIEW MODE STATE =====
  readonly viewMode = this.viewPrefs.viewMode;
  readonly animationEnabled = this.viewPrefs.animationEnabled;
  readonly recentlyAdded = this.viewPrefs.recentlyAdded;
  readonly recentlyRemoved = this.viewPrefs.recentlyRemoved;
  readonly recentlyToggledTheme = this.viewPrefs.recentlyToggledTheme;

  // ===== DATA SOURCE =====
  private locations: City[] = [
    { name: 'Honolulu', lat: 21.3069, lon: -157.8583 }, // Hawaii, AS
    { name: 'Anchorage', lat: 61.2181, lon: -149.9003 }, // Alaska, AS
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 }, // Pantai Barat AS (PST)
    { name: 'Denver', lat: 39.7392, lon: -104.9903 }, // Pegunungan AS (MST)
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 }, // Tengah AS (CST)
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332 }, // Meksiko
    { name: 'New York', lat: 40.7128, lon: -74.0060 }, // Pantai Timur AS (EST)
    { name: 'Toronto', lat: 43.6532, lon: -79.3832 }, // Kanada
    { name: 'Santiago', lat: -33.4489, lon: -70.6693 }, // Chile
    { name: 'Sao Paulo', lat: -23.5505, lon: -46.6333 }, // Brasil
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 }, // Argentina

    // --- EROPA & AFRIKA (Garis Tengah) ---
    { name: 'Reykjavik', lat: 64.1466, lon: -21.9426 }, // Islandia
    { name: 'London', lat: 51.5074, lon: -0.1278 }, // Inggris (GMT)
    { name: 'Casablanca', lat: 33.5731, lon: -7.5898 }, // Maroko
    { name: 'Paris', lat: 48.8566, lon: 2.3522 }, // Prancis (CET)
    { name: 'Berlin', lat: 52.5200, lon: 13.4050 }, // Jerman (CET)
    { name: 'Rome', lat: 41.9028, lon: 12.4964 }, // Italia (CET)
    { name: 'Lagos', lat: 6.5244, lon: 3.3792 }, // Nigeria
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241 }, // Afrika Selatan
    { name: 'Cairo', lat: 30.0444, lon: 31.2357 }, // Mesir
    { name: 'Athens', lat: 37.9838, lon: 23.7275 }, // Yunani
    { name: 'Istanbul', lat: 41.0082, lon: 28.9784 }, // Turki
    { name: 'Moscow', lat: 55.7558, lon: 37.6173 }, // Rusia
    { name: 'Riyadh', lat: 24.7136, lon: 46.6753 }, // Arab Saudi
    { name: 'Nairobi', lat: -1.2921, lon: 36.8219 }, // Kenya
    { name: 'Betlehem', lat: 31.7054, lon: 35.2024 }, // Israel

    // --- ASIA & TIMUR TENGAH ---
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 }, // Uni Emirat Arab
    { name: 'Tehran', lat: 35.6892, lon: 51.3890 }, // Iran
    { name: 'Jerusalem', lat: 31.7683, lon: 35.2137 }, // Israel
    { name: 'Karachi', lat: 24.8607, lon: 67.0011 }, // Pakistan
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 }, // India
    { name: 'Kathmandu', lat: 27.7172, lon: 85.3240 }, // Nepal (Offset unik!)
    { name: 'Manama', lat: 26.2235, lon: 50.5876 }, // Bahrain
    { name: 'Dhaka', lat: 23.8103, lon: 90.4125 }, // Bangladesh
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018 }, // Thailand
    { name: 'Medan', lat: 3.5952, lon: 98.6722 }, // Indonesia (WIB)
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456 }, // Indonesia (WIB)
    { name: 'Singapore', lat: 1.3521, lon: 103.8198 }, // Singapura
    { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 }, // Malaysia
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 }, // Hong Kong
    { name: 'Beijing', lat: 39.9042, lon: 116.4074 }, // China
    { name: 'Chongqing', lat: 29.4316, lon: 106.9123 }, // China
    { name: 'Bali', lat: -8.3405, lon: 115.0920 }, // Indonesia (WITA)
    { name: 'Tanjung Selor', lat: 2.8032, lon: 117.3839 }, // Indonesia (WITA)
    { name: 'Perth', lat: -31.9505, lon: 115.8605 }, // Australia Barat
    { name: 'Tokyo', lat: 35.6895, lon: 139.6917 },
    { name: 'Osaka', lat: 34.6937, lon: 135.5023 },
    { name: 'Kyoto', lat: 35.0116, lon: 135.7681 }, // Jepang
    { name: 'Seoul', lat: 37.5665, lon: 126.9780 }, // Korea Selatan
    { name: 'Jayapura', lat: -2.5339, lon: 140.7181 }, // Indonesia (WIT)
    { name: 'Adelaide', lat: -34.9285, lon: 138.6007 }, // Australia Tengah

    // --- PASIFIK & AUSTRALIA ---
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 }, // Australia Timur
    { name: 'Guam', lat: 13.4443, lon: 144.7937 }, // Teritori AS
    { name: 'Auckland', lat: -36.8485, lon: 174.7633 }, // Selandia Baru
    { name: 'Fiji', lat: -17.7134, lon: 178.0650 }, // Fiji
    { name: 'Darwin', lat: -12.4634, lon: 130.8456 },   // Australia Tengah (tanpa DST)
    { name: 'Hobart', lat: -42.8821, lon: 147.3272 },
    { name: 'Suva', lat: -18.1416, lon: 178.4419 },     // Fiji (ibukota)
    { name: 'Honiara', lat: -9.4319, lon: 159.9554 },   // Kep. Solomon
    { name: 'Papeete', lat: -17.5516, lon: -149.5585 },// Polinesia Prancis (UTC-10)
  ].map((city) => ({ ...city, timeZone: getCityTimeZone(city) }));

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
    this.pagination.loadMore();
  }

  toggleFavoritesOnly() {
    this.showFavoritesOnly.update((v) => !v);
    this.pagination.reset();
    this.searchService.clearSearch();
  }

  resetPagination() {
    this.pagination.reset();
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
    this.viewPrefs.setViewMode(mode);
  }

  toggleAnimation(): void {
    this.viewPrefs.toggleAnimation();
  }

  isAnimationEnabled(): boolean {
    return this.animationEnabled();
  }

  // Animation triggers
  triggerAddAnimation(cityName: string): void {
    this.viewPrefs.triggerAddAnimation(cityName);
  }

  triggerRemoveAnimation(cityName: string): void {
    this.viewPrefs.triggerRemoveAnimation(cityName);
  }

  triggerThemeAnimation(): void {
    this.viewPrefs.triggerThemeAnimation();
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
}
