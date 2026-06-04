import { Injectable, signal } from '@angular/core';

export type ClockDisplayMode = 'digital' | 'analog' | 'binary';

interface ClockDisplayPreference {
  mode: ClockDisplayMode;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClockDisplayService {
  private readonly STORAGE_KEY = 'jam-dunia-clock-display-mode';
  private readonly DEFAULT_MODE: ClockDisplayMode = 'digital';

  // Signal untuk mode tampilan jam saat ini
  currentMode = signal<ClockDisplayMode>(this.loadPreference());

  constructor() {
    this.initializeDisplay();
  }

  /**
   * Load preferensi dari localStorage
   */
  private loadPreference(): ClockDisplayMode {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.isValidMode(saved)) {
        return saved as ClockDisplayMode;
      }
    } catch {
      console.warn('Failed to load clock display preference from localStorage');
    }
    return this.DEFAULT_MODE;
  }

  /**
   * Validasi apakah mode valid
   */
  private isValidMode(mode: string): mode is ClockDisplayMode {
    return ['digital', 'analog', 'binary'].includes(mode);
  }

  /**
   * Initialize display mode dengan menyimpan ke localStorage
   */
  private initializeDisplay(): void {
    this.savePreference(this.currentMode());
  }

  /**
   * Set mode tampilan jam
   */
  setMode(mode: ClockDisplayMode): void {
    if (this.isValidMode(mode)) {
      this.currentMode.set(mode);
      this.savePreference(mode);
    }
  }

  /**
   * Toggle ke mode berikutnya (digital → analog → binary → digital)
   */
  toggleMode(): void {
    const modes: ClockDisplayMode[] = ['digital', 'analog', 'binary'];
    const currentIndex = modes.indexOf(this.currentMode());
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  /**
   * Get mode tampilan jam saat ini
   */
  getMode(): ClockDisplayMode {
    return this.currentMode();
  }

  /**
   * Simpan preferensi ke localStorage
   */
  private savePreference(mode: ClockDisplayMode): void {
    try {
      const preference: ClockDisplayPreference = {
        mode,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, mode);
    } catch {
      console.warn('Failed to save clock display preference to localStorage');
    }
  }

  /**
   * Reset ke mode default
   */
  resetToDefault(): void {
    this.setMode(this.DEFAULT_MODE);
  }

  /**
   * Get daftar semua mode yang tersedia
   */
  getAvailableModes(): ClockDisplayMode[] {
    return ['digital', 'analog', 'binary'];
  }

  /**
   * Get label untuk mode (untuk UI)
   */
  getModeLabel(mode: ClockDisplayMode): string {
    const labels: Record<ClockDisplayMode, string> = {
      digital: '🕐 Digital',
      analog: '🕰️ Analog',
      binary: '⚙️ Binary',
    };
    return labels[mode];
  }
}
