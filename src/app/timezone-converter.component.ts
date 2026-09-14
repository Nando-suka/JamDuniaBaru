import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimezoneConverterService } from './timezone-converter.service';
import { ClockFacade } from './clock.facade';
import { LanguageService } from './languange.service';
import { City } from './search.service';

@Component({
  selector: 'app-timezone-converter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timezone-converter.component.html',
  styleUrl: './timezone-converter.component.css',
})
export class TimezoneConverterComponent implements OnInit, OnDestroy {
  private converterService = inject(TimezoneConverterService);
  private facade = inject(ClockFacade);
  private langService = inject(LanguageService);

  // State
  isExpanded = signal(true);
  searchFromQuery = signal('');
  searchToQuery = signal('');
  showFromDropdown = signal(false);
  showToDropdown = signal(false);
  private timer: any;
  highlightedFromIndex = signal(-1);
  highlightedToIndex = signal(-1);

  // Dictionary untuk terjemahan
  dict = this.langService.text;

  // Get all cities from facade
  get cities(): City[] {
    return this.facade.getAllLocations();
  }

  // Get filtered cities untuk dropdown
  get filteredFromCities(): City[] {
    const query = this.searchFromQuery().toLowerCase().trim();
    if (!query) return this.cities;

    const starts = this.cities.filter((city) => city.name.toLowerCase().startsWith(query));

    const includes = this.cities.filter(
      (city) =>
        city.name.toLowerCase().includes(query) && !city.name.toLowerCase().startsWith(query)
    );

    return [...starts, ...includes];
  }

  get filteredToCities(): City[] {
    const query = this.searchToQuery().toLowerCase().trim();
    if (!query) return this.cities;

    const starts = this.cities.filter((city) => city.name.toLowerCase().startsWith(query));

    const includes = this.cities.filter(
      (city) =>
        city.name.toLowerCase().includes(query) && !city.name.toLowerCase().startsWith(query)
    );

    return [...starts, ...includes];
  }

  // Signal bindings
  get selectedFromCity() {
    return this.converterService.selectedFromCity;
  }
  get selectedToCity() {
    return this.converterService.selectedToCity;
  }
  get inputTime() {
    return this.converterService.inputTime;
  }
  get inputDate() {
    return this.converterService.inputDate;
  }
  get useCurrentTime() {
    return this.converterService.useCurrentTime;
  }
  get convertedResult() {
    return this.converterService.convertedResult;
  }

  ngOnInit() {
    // Update waktu setiap detik jika menggunakan waktu saat ini
    this.timer = setInterval(() => {
      if (this.useCurrentTime()) {
        this.converterService.refreshCurrentTime();
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // Toggle panel
  togglePanel(): void {
    this.isExpanded.update((v) => !v);
  }

  // Select city from dropdown
  selectFromCity(city: City): void {
    this.converterService.setFromCity(city);
    this.showFromDropdown.set(false);
    this.searchFromQuery.set('');
    this.highlightedFromIndex.set(-1);
  }

  clearFromSelection(): void {
    this.converterService.clearFromCity();
    this.searchFromQuery.set('');
    this.showFromDropdown.set(false);
    this.highlightedFromIndex.set(-1);
  }

  selectToCity(city: City): void {
    this.converterService.setToCity(city);
    this.showToDropdown.set(false);
    this.searchToQuery.set('');
    this.highlightedToIndex.set(-1);
  }

  clearToSelection(): void {
    this.converterService.clearToCity();
    this.searchToQuery.set('');
    this.showToDropdown.set(false);
    this.highlightedToIndex.set(-1);
  }

  // Toggle dropdowns
  toggleFromDropdown(): void {
    this.showFromDropdown.update((v) => !v);
    this.showToDropdown.set(false);
    this.highlightedFromIndex.set(-1);
  }

  toggleToDropdown(): void {
    this.showToDropdown.update((v) => !v);
    this.showFromDropdown.set(false);
    this.highlightedToIndex.set(-1);
  }

  // Close dropdowns when clicking outside
  closeDropdowns(): void {
    this.showFromDropdown.set(false);
    this.showToDropdown.set(false);
    this.highlightedFromIndex.set(-1);
    this.highlightedToIndex.set(-1);
  }

  // Update search queries
  onFromSearchChange(query: string): void {
    if (this.selectedFromCity() && query !== this.selectedFromCity()?.name) {
      this.converterService.clearFromCity();
    }
    this.searchFromQuery.set(query);
    this.showFromDropdown.set(true);
    this.highlightedFromIndex.set(-1);
  }

  onToSearchChange(query: string): void {
    if (this.selectedToCity() && query !== this.selectedToCity()?.name) {
      this.converterService.clearToCity();
    }
    this.searchToQuery.set(query);
    this.showToDropdown.set(true);
    this.highlightedToIndex.set(-1);
  }

  // Update time/date inputs
  onTimeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.converterService.setInputTime(value);
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.converterService.setInputDate(value);
  }

  onUseCurrentTimeChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.converterService.setUseCurrentTime(checked);
  }

  handleFromKeydown(event: KeyboardEvent): void {
    this.handleCityKeydown(event, this.filteredFromCities, 'from');
  }

  handleToKeydown(event: KeyboardEvent): void {
    this.handleCityKeydown(event, this.filteredToCities, 'to');
  }

  private handleCityKeydown(event: KeyboardEvent, cities: City[], direction: 'from' | 'to'): void {
    if (!cities || cities.length === 0) return;

    const currentIndex = direction === 'from' ? this.highlightedFromIndex() : this.highlightedToIndex();
    const setIndex = (index: number) => {
      if (direction === 'from') {
        this.highlightedFromIndex.set(index);
      } else {
        this.highlightedToIndex.set(index);
      }
    };

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIndex(currentIndex < cities.length - 1 ? currentIndex + 1 : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIndex(currentIndex > 0 ? currentIndex - 1 : cities.length - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setIndex(cities.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (currentIndex >= 0) {
        direction === 'from' ? this.selectFromCity(cities[currentIndex]) : this.selectToCity(cities[currentIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdowns();
    }
  }

  // Swap cities
  swapCities(): void {
    this.converterService.swapCities();
  }

  // Reset
  reset(): void {
    this.converterService.reset();
    this.searchFromQuery.set('');
    this.searchToQuery.set('');
    this.highlightedFromIndex.set(-1);
    this.highlightedToIndex.set(-1);
  }

  // Format helpers
  formatTime(date: Date): string {
    return this.converterService.formatTime(date, '24h');
  }

  formatDate(date: Date): string {
    return this.converterService.formatDate(date);
  }

  getOffsetInfo(): string {
    return this.converterService.getOffsetInfo();
  }

  // Get offset string for a city
  getOffsetString(offset: number): string {
    const sign = offset >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.abs(((offset % 1) * 60));

    if (minutes > 0) {
      return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
    }
    return `UTC${sign}${hours}`;
  }
}
