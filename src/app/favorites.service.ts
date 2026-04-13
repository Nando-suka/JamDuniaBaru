import { Injectable, signal } from '@angular/core';
import { City } from './search.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'jam-dunia-favorites';
  
  // Signal untuk menyimpan daftar favorite cities
  favoritesList = signal<City[]>(this.loadFavoritesFromStorage());

  constructor() {}

  /**
   * Load favorites dari localStorage
   */
  private loadFavoritesFromStorage(): City[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
      return [];
    }
  }

  /**
   * Save favorites ke localStorage
   */
  private saveFavoritesToStorage(favorites: City[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to storage:', error);
    }
  }

  /**
   * Check apakah city adalah favorite
   */
  isFavorite(city: City): boolean {
    return this.favoritesList().some(fav => fav.name === city.name);
  }

  /**
   * Add city ke favorites
   */
  addFavorite(city: City): void {
    if (!this.isFavorite(city)) {
      const updated = [...this.favoritesList(), city];
      this.favoritesList.set(updated);
      this.saveFavoritesToStorage(updated);
    }
  }

  /**
   * Remove city dari favorites
   */
  removeFavorite(city: City): void {
    const updated = this.favoritesList().filter(fav => fav.name !== city.name);
    this.favoritesList.set(updated);
    this.saveFavoritesToStorage(updated);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(city: City): void {
    if (this.isFavorite(city)) {
      this.removeFavorite(city);
    } else {
      this.addFavorite(city);
    }
  }

  /**
   * Get all favorites
   */
  getFavorites(): City[] {
    return this.favoritesList();
  }

  /**
   * Clear all favorites
   */
  clearAllFavorites(): void {
    this.favoritesList.set([]);
    this.saveFavoritesToStorage([]);
  }

  /**
   * Get count of favorites
   */
  getFavoritesCount(): number {
    return this.favoritesList().length;
  }
}
