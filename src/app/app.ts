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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AlarmTimerComponent, TimezoneConverterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  // Pakai Signal
  currentTime = signal(new Date());
  langService = inject(LanguageService); // berhubungan dengan layanan languange
  detectionService = inject(LanguageDetectionService); // untuk deteksi bahasa otomatis
  themeService = inject(ThemeService); // untuk mengelola tema
  searchService = inject(SearchService); // untuk search/filter cities
  favoritesService = inject(FavoritesService); // untuk manage favorites
  facade = inject(ClockFacade);
  timeFormat = signal<'12h' | '24h'>(this.getStoredTimeFormat()); // Time format preference
  showAlarmTimer = signal(false); // Toggle untuk panel alarm/timer
  showTimezoneConverter = signal(false); // Toggle untuk panel konverter zona waktu
  // Visibility of scroll-to-top button
  scrollVisible = signal(false);
  // Label visibility when the scroll button is clicked (mobile guidance)
  scrollLabelVisible = signal(false);
  private scrollLabelTimer: any;
  private onScroll = () => {
    this.scrollVisible.set(window.scrollY > 240);
  };
  private timer: any;

  dict = this.langService.text;

  // Retrieve stored time format from localStorage
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
      // Update signal: .set()
      this.currentTime.set(new Date());
    }, 1000);

    // Deteksi bahasa otomatis berdasarkan lokasi jika browser language adalah default
    this.detectAndSetLanguage();

    // Show/hide scroll-to-top button based on scroll position
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  async detectAndSetLanguage() {
    try {
      const browserLang = this.detectionService.detectBrowserLanguage();
      if (browserLang === 'en') {
        // Jika browser adalah English, coba deteksi berdasarkan lokasi
        const locationLang = await this.detectionService.detectLanguageByLocation();
        this.langService.setLanguage(locationLang as 'id' | 'en');
      } else {
        this.langService.setLanguage(browserLang as 'id' | 'en');
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      // Fallback ke bahasa default
    }
  }

  // mendapaktna bagian waktu untuk setiap offset dari angkanya
  getTimeByOffset(offset: number): Date {
    const d = this.currentTime(); // Ambil nilai signal dengan tanda kurung ()
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * offset);
  }

  // Get formatted time string based on preference
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

  // Toggle time format between 12h and 24h
  toggleTimeFormat(): void {
    const newFormat = this.timeFormat() === '24h' ? '12h' : '24h';
    this.timeFormat.set(newFormat);
    try {
      localStorage.setItem('jam-dunia-time-format', newFormat);
    } catch (error) {
      console.error('Error saving time format preference:', error);
    }
  }

  // Scroll halus ke atas
  scrollToTop(): void {
    // show temporary label on mobile to indicate purpose
    try {
      this.scrollLabelVisible.set(true);
      if (this.scrollLabelTimer) {
        clearTimeout(this.scrollLabelTimer);
      }
      this.scrollLabelTimer = setTimeout(() => this.scrollLabelVisible.set(false), 1400);
    } catch {}

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Toggle antara light/dark theme
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Toggle timezone converter panel
   */
  toggleTimezoneConverter(): void {
    this.showTimezoneConverter.update((v) => !v);
  }

  // Cycle through view modes (list -> grid -> compact -> list)
  cycleViewMode(): void {
    const modes: Array<'list' | 'grid' | 'compact'> = ['list', 'grid', 'compact'];
    const currentMode = this.facade.getViewMode()();
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.facade.setViewMode(modes[nextIndex]);
  }

  /**
   * Get icon for current view mode
   */
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

  /**
   * Get title for current view mode
   */
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

  /**
   * Get CSS classes for current view mode
   */
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

  /**
   * Track items by name to preserve DOM state.
   */
  trackByLocationName(_index: number, loc: { name: string }): string {
    return loc.name;
  }

  /**
   * Cleanup ketika component destroy
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
    window.removeEventListener('scroll', this.onScroll);
    if (this.scrollLabelTimer) {
      clearTimeout(this.scrollLabelTimer);
    }
  }
}
