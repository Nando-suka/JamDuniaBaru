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
  styleUrl: './app.css'
})

export class App implements OnInit, OnDestroy {
  // Pakai Signal! Ini standar Angular masa depan
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
  private timer: any;

  dict = this.langService.text;

  // Retrieve stored time format from localStorage
  private getStoredTimeFormat(): '12h' | '24h' {
    try {
      const stored = localStorage.getItem('jam-dunia-time-format');
      return (stored === '12h' || stored === '24h') ? stored : '24h';
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
  }

  async detectAndSetLanguage() {
    try {
      const browserLang = this.detectionService.detectBrowserLanguage();
      if (browserLang === 'en') { // Jika browser adalah English, coba deteksi berdasarkan lokasi
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

  // mendaptkan function untuk waktu setiap kota
  getCityTime(offset: number): Date {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (offset * 3600000));
  }

  // mendapaktna bagian waktu untuk setiap offset dari angkanya
  getTimeByOffset(offset: number): Date {
    const d = this.currentTime(); // Ambil nilai signal dengan tanda kurung ()
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * offset));
  }

  /**
   * Get formatted time string based on preference
   */
  getFormattedTime(offset: number): string {
    const timeDate = this.getTimeByOffset(offset);
    const format = this.timeFormat() === '12h' ? 'hh:mm:ss a' : 'HH:mm:ss';
    // Manual formatting since we need to support both 12h and 24h
    const hours = timeDate.getHours();
    const minutes = timeDate.getMinutes();
    const seconds = timeDate.getSeconds();
    
    if (this.timeFormat() === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    } else {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  /**
   * Toggle time format between 12h and 24h
   */
  toggleTimeFormat(): void {
    const newFormat = this.timeFormat() === '24h' ? '12h' : '24h';
    this.timeFormat.set(newFormat);
    try {
      localStorage.setItem('jam-dunia-time-format', newFormat);
    } catch (error) {
      console.error('Error saving time format preference:', error);
    }
  }

  /**
   * Scroll halus ke atas
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Scroll halus
    });
  }

  /**
   * Toggle antara light/dark theme
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Toggle timezone converter panel
   */
  toggleTimezoneConverter(): void {
    this.showTimezoneConverter.update(v => !v);
  }

  /**
   * Cleanup ketika component destroy
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}