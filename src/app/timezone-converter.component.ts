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
  styleUrl: './timezone-converter.component.css'
})
export class TimezoneConverterComponent implements OnInit, OnDestroy {
  private converterService = inject(TimezoneConverterService);
  private facade = inject(ClockFacade);
  private langService = inject(LanguageService);

  // State
  isExpanded = signal(false);
  searchFromQuery = signal('');
  searchToQuery = signal('');
  showFromDropdown = signal(false);
  showToDropdown = signal(false);
  private timer: any;

  // Dictionary untuk terjemahan
  dict = this.langService.text;

  // Get all cities from facade
  get cities(): City[] {
    return this.facade.getAllLocations();
  }

  // Get filtered cities untuk dropdown
  get filteredFromCities(): City[] {
    const query = this.searchFromQuery().toLowerCase();
    if (!query) return this.cities;
    return this.cities.filter(city => 
      city.name.toLowerCase().includes(query)
    );
  }

  get filteredToCities(): City[] {
    const query = this.searchToQuery().toLowerCase();
    if (!query) return this.cities;
    return this.cities.filter(city => 
      city.name.toLowerCase().includes(query)
    );
  }

  // Signal bindings
  get selectedFromCity() { return this.converterService.selectedFromCity; }
  get selectedToCity() { return this.converterService.selectedToCity; }
  get inputTime() { return this.converterService.inputTime; }
  get inputDate() { return this.converterService.inputDate; }
  get useCurrentTime() { return this.converterService.useCurrentTime; }
  get convertedResult() { return this.converterService.convertedResult; }

  ngOnInit() {
    // Update waktu setiap detik jika menggunakan waktu saat ini
    this.timer = setInterval(() => {
      if (this.useCurrentTime()) {
        // Trigger recompute
        this.converterService.setUseCurrentTime(true);
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
    this.isExpanded.update(v => !v);
  }

  // Select city from dropdown
  selectFromCity(city: City): void {
    this.converterService.setFromCity(city);
    this.showFromDropdown.set(false);
    this.searchFromQuery.set('');
  }

  selectToCity(city: City): void {
    this.converterService.setToCity(city);
    this.showToDropdown.set(false);
    this.searchToQuery.set('');
  }

  // Toggle dropdowns
  toggleFromDropdown(): void {
    this.showFromDropdown.update(v => !v);
    this.showToDropdown.set(false);
  }

  toggleToDropdown(): void {
    this.showToDropdown.update(v => !v);
    this.showFromDropdown.set(false);
  }

  // Close dropdowns when clicking outside
  closeDropdowns(): void {
    this.showFromDropdown.set(false);
    this.showToDropdown.set(false);
  }

  // Update search queries
  onFromSearchChange(query: string): void {
    this.searchFromQuery.set(query);
    this.showFromDropdown.set(true);
  }

  onToSearchChange(query: string): void {
    this.searchToQuery.set(query);
    this.showToDropdown.set(true);
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

  // Swap cities
  swapCities(): void {
    this.converterService.swapCities();
  }

  // Reset
  reset(): void {
    this.converterService.reset();
    this.searchFromQuery.set('');
    this.searchToQuery.set('');
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
    const minutes = Math.abs((offset % 1) * 60);
    
    if (minutes > 0) {
      return `UTC${sign}${offset}`;
    }
    return `UTC${sign}${offset}`;
  }
}