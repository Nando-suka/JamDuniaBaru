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

  // ===== DATA SOURCE =====
  private locations: City[] = [
    { name: 'Honolulu', offset: -10 },   // Hawaii, AS
  { name: 'Anchorage', offset: -9 },   // Alaska, AS
  { name: 'Los Angeles', offset: -8 }, // Pantai Barat AS (PST)
  { name: 'Denver', offset: -7 },      // Pegunungan AS (MST)
  { name: 'Chicago', offset: -6 },     // Tengah AS (CST)
  { name: 'Mexico City', offset: -6 }, // Meksiko
  { name: 'New York', offset: -5 },    // Pantai Timur AS (EST)
  { name: 'Toronto', offset: -5 },     // Kanada
  { name: 'Santiago', offset: -4 },    // Chile
  { name: 'Sao Paulo', offset: -3 },   // Brasil
  { name: 'Buenos Aires', offset: -3 },// Argentina

  // --- EROPA & AFRIKA (Garis Tengah) ---
  { name: 'Reykjavik', offset: 0 },    // Islandia
  { name: 'London', offset: 0 },       // Inggris (GMT)
  { name: 'Casablanca', offset: 1 },   // Maroko
  { name: 'Paris', offset: 1 },        // Prancis (CET)
  { name: 'Berlin', offset: 1 },       // Jerman (CET)
  { name: 'Rome', offset: 1 },         // Italia (CET)
  { name: 'Lagos', offset: 1 },        // Nigeria
  { name: 'Cape Town', offset: 2 },    // Afrika Selatan
  { name: 'Cairo', offset: 2 },        // Mesir
  { name: 'Athens', offset: 2 },       // Yunani
  { name: 'Istanbul', offset: 3 },     // Turki
  { name: 'Moscow', offset: 3 },       // Rusia
  { name: 'Riyadh', offset: 3 },       // Arab Saudi
  { name: 'Nairobi', offset: 3 },      // Kenya
  { name: 'Betlehem', offset: 5},      // Israel

  // --- ASIA & TIMUR TENGAH ---
  { name: 'Dubai', offset: 4 },        // Uni Emirat Arab
  { name: 'Tehran', offset: 3.5 },     // Iran
  { name: 'Jerusalem', offset: 3},     // Israel
  { name: 'Karachi', offset: 5 },      // Pakistan
  { name: 'Mumbai', offset: 5.5 },     // India
  { name: 'Kathmandu', offset: 5.75 }, // Nepal (Offset unik!)
  { name: 'Manama', offset: 6},        // Bahrain
  { name: 'Dhaka', offset: 6 },        // Bangladesh
  { name: 'Bangkok', offset: 7 },      // Thailand
  { name: 'Medan', offset: 7},         // Indonesia (WIB)
  { name: 'Jakarta', offset: 7 },      // Indonesia (WIB)
  { name: 'Singapore', offset: 8 },    // Singapura
  { name: 'Kuala Lumpur', offset: 8 }, // Malaysia
  { name: 'Hong Kong', offset: 8 },    // Hong Kong
  { name: 'Beijing', offset: 8 },      // China
  { name: 'Bali', offset: 8 },         // Indonesia (WITA)
  { name: 'Perth', offset: 8 },        // Australia Barat
  { name: 'Tokyo', offset: 9 },   
  { name: 'Osaka', offset: 9},
  { name: 'Kyoto', offset: 9},     // Jepang
  { name: 'Seoul', offset: 9 },        // Korea Selatan
  { name: 'Jayapura', offset: 9 },     // Indonesia (WIT)
  { name: 'Adelaide', offset: 9.5 },   // Australia Tengah

  // --- PASIFIK & AUSTRALIA ---
  { name: 'Sydney', offset: 10 },      // Australia Timur
  { name: 'Guam', offset: 10 },        // Teritori AS
  { name: 'Auckland', offset: 12 },    // Selandia Baru
  { name: 'Fiji', offset: 12 }         // Fiji
  ];

  // ===== COMPUTED =====
  filteredLocations = computed(() => {
    let data = this.locations;

    if (this.showFavoritesOnly()) {
      data = data.filter(loc => this.favoritesService.isFavorite(loc));
    }

    return this.searchService.filterCities(
      data,
      this.searchService.searchQuery()
    );
  });

  isAllLoaded = computed(() => {
    return !this.searchService.searchQuery() &&
      this.itemsToShow() >= this.filteredLocations().length &&
      this.filteredLocations().length > 0;
  });

  // ===== ACTIONS =====
  loadMore() {
    this.isLoading.set(true);

    setTimeout(() => {
      this.itemsToShow.update(v => v + 12);
      this.isLoading.set(false);
    }, 1000);
  }

  toggleFavoritesOnly() {
    this.showFavoritesOnly.update(v => !v);
    this.itemsToShow.set(12);
    this.searchService.clearSearch();
  }

  resetPagination() {
    this.itemsToShow.set(12);
  }

  getFavoritesCount() {
    return this.favoritesService.getFavoritesCount();
  }

  isFavorite(city: City) {
    return this.favoritesService.isFavorite(city);
  }

  toggleFavorite(city: City) {
    this.favoritesService.toggleFavorite(city);
  }
}