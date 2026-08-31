import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { LanguageService } from './languange.service';
import { LanguageDetectionService } from './languange-detection.service';
import { ThemeService } from './theme.service';
import { SearchService } from './search.service';
import { FavoritesService } from './favorites.service';
import { CommonModule } from '@angular/common';
import { ClockFacade } from './clock.facade';
import { AlarmTimerComponent } from './alarm-timer.component';
import { TimezoneConverterComponent } from './timezone-converter.component';
import { AnalogClockComponent } from './analog-clock.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AlarmTimerComponent, TimezoneConverterComponent, AnalogClockComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  currentTime = signal(new Date());
  langService = inject(LanguageService);
  detectionService = inject(LanguageDetectionService);
  themeService = inject(ThemeService);
  searchService = inject(SearchService);
  favoritesService = inject(FavoritesService);
  facade = inject(ClockFacade);
  timeFormat = signal<'12h' | '24h'>(this.getStoredTimeFormat());
  showAlarmTimer = signal(false);
  showTimezoneConverter = signal(false);
  showAnalogClock = signal(false);
  showMapView = signal(false);
  showToolsSheet = signal(false);
  isMobileView = signal(false);
  scrollVisible = signal(false);
  scrollLabelVisible = signal(false);
  private scrollLabelTimer: any;
  private onScroll = () => {
    this.scrollVisible.set(window.scrollY > 240);
  };
  private onResize = () => {
    this.isMobileView.set(window.innerWidth <= 767);
    if (!this.isMobileView()) {
      this.showToolsSheet.set(false);
    }
  };
  private timer: any;

  dict = this.langService.text;

  private getStoredTimeFormat(): '12h' | '24h' {
    try {
      const stored = localStorage.getItem('jam-dunia-time-format');
      return stored === '12h' || stored === '24h' ? stored : '24h';
    } catch {
      return '24h';
    }
  }

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.onResize();
    this.detectAndSetLanguage();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  async detectAndSetLanguage() {
    try {
      const browserLang = this.detectionService.detectBrowserLanguage();
      if (browserLang === 'en') {
        const locationLang = await this.detectionService.detectLanguageByLocation();
        this.langService.setLanguage(locationLang as 'id' | 'en');
      } else {
        this.langService.setLanguage(browserLang as 'id' | 'en');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
    }
  }

  getTimeByOffset(offset: number): Date {
    const d = this.currentTime();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * offset);
  }

  getFormattedTime(offset: number): string {
    const timeDate = this.getTimeByOffset(offset);
    const locale = this.langService.currentLang() === 'id' ? 'id-ID' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: this.timeFormat() === '12h',
      timeZone: 'UTC',
    }).format(timeDate);
  }

  toggleTimeFormat(): void {
    const newFormat = this.timeFormat() === '24h' ? '12h' : '24h';
    this.timeFormat.set(newFormat);
    try {
      localStorage.setItem('jam-dunia-time-format', newFormat);
    } catch (error) {
      console.error('Error saving time format preference:', error);
    }
  }

  scrollToTop(): void {
    try {
      this.scrollLabelVisible.set(true);
      if (this.scrollLabelTimer) {
        clearTimeout(this.scrollLabelTimer);
      }
      this.scrollLabelTimer = setTimeout(() => this.scrollLabelVisible.set(false), 1400);
    } catch {}

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleToolsSheet(): void {
    this.showToolsSheet.update((v) => !v);
  }

  closeToolsSheet(): void {
    this.showToolsSheet.set(false);
  }

  handleToolAction(action: 'format' | 'favorites' | 'theme' | 'alarm' | 'converter' | 'map' | 'view'): void {
    switch (action) {
      case 'format':
        this.toggleTimeFormat();
        break;
      case 'favorites':
        this.facade.toggleFavoritesOnly();
        break;
      case 'theme':
        this.toggleTheme();
        break;
      case 'alarm':
        this.showAlarmTimer.update((v) => !v);
        break;
      case 'converter':
        this.toggleTimezoneConverter();
        break;
      case 'map':
        this.toggleMapView();
        break;
      case 'view':
        this.toggleAnalogClock();
        break;
      default:
        break;
    }

    this.closeToolsSheet();
  }

  toggleTimezoneConverter(): void {
    this.showTimezoneConverter.update((v) => !v);
  }

  toggleAnalogClock(): void {
    this.showAnalogClock.update((v) => !v);
  }

  toggleMapView(): void {
    this.showMapView.update((v) => !v);
  }

  cycleViewMode(): void {
    const modes: Array<'list' | 'grid' | 'compact'> = ['list', 'grid', 'compact'];
    const currentMode = this.facade.getViewMode()();
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.facade.setViewMode(modes[nextIndex]);
  }

  getViewModeIcon(): string {
    const mode = this.facade.getViewMode()();
    switch (mode) {
      case 'list':
        return '📋';
      case 'grid':
        return '🔲';
      case 'compact':
        return '≡';
      default:
        return '📋';
    }
  }

  getViewModeTitle(): string {
    const mode = this.facade.getViewMode()();
    switch (mode) {
      case 'list':
        return 'Mode Daftar (List)';
      case 'grid':
        return 'Mode Grid';
      case 'compact':
        return 'Mode Kompak';
      default:
        return 'Mode Daftar';
    }
  }

  getViewModeClass(): string {
    const mode = this.facade.getViewMode()();
    switch (mode) {
      case 'list':
        return 'view-mode-list';
      case 'grid':
        return 'view-mode-grid';
      case 'compact':
        return 'view-mode-compact';
      default:
        return 'view-mode-list';
    }
  }

  trackByLocationName(_index: number, loc: { name: string }): string {
    return loc.name;
  }

  selectCityOnMap(cityName: string): void {
    this.searchService.updateSearchQuery(cityName);
    if (!this.showMapView()) {
      this.showMapView.set(true);
    }
  }

  getLongitudePercent(lon: number): number {
    return ((lon + 180) / 360) * 100;
  }

  getLatitudePercent(lat: number): number {
    return ((90 - lat) / 180) * 100;
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    if (this.scrollLabelTimer) {
      clearTimeout(this.scrollLabelTimer);
    }
  }
}