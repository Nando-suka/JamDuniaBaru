import { Injectable, signal, computed } from '@angular/core';
import { City, getCityTimeZone } from './search.service';

const TIMEZONE_CONVERTER_STORAGE_KEY = 'jam-dunia-timezone-converter';

export interface TimeConversion {
  fromCity: City;
  toCity: City;
  sourceTime: Date;
  convertedTime: Date;
  offsetDifference: number;
}

@Injectable({
  providedIn: 'root',
})
export class TimezoneConverterService {
  // State untuk konverter
  selectedFromCity = signal<City | null>(null);
  selectedToCity = signal<City | null>(null);
  inputTime = signal<string>('00:00');
  inputDate = signal<string>(this.todayLocalDate());
  useCurrentTime = signal<boolean>(true);
  currentTime = signal(new Date());

  constructor() {
    this.loadFromStorage();
  }

  // Computed: hasil konversi waktu
  convertedResult = computed(() => {
    const from = this.selectedFromCity();
    const to = this.selectedToCity();

    if (!from || !to) {
      return null;
    }

    const sourceDate = this.useCurrentTime()
      ? this.currentTime()
      : this.createDateFromInputs(getCityTimeZone(from));

    if (!sourceDate || isNaN(sourceDate.getTime())) {
      return null;
    }

    const offsetDifference =
      (this.getTimeZoneOffsetMinutes(getCityTimeZone(to), sourceDate) -
        this.getTimeZoneOffsetMinutes(getCityTimeZone(from), sourceDate)) /
      60;

    return {
      fromCity: from,
      toCity: to,
      sourceTime: sourceDate,
      convertedTime: sourceDate,
      offsetDifference,
    } as TimeConversion;
  });

  /**
   * Set kota asal untuk konversi
   * @param city Kota asal
   */
  setFromCity(city: City): void {
    this.selectedFromCity.set(city);
    this.saveToStorage();
  }

  clearFromCity(): void {
    this.selectedFromCity.set(null);
    this.saveToStorage();
  }

  /**
   * Set kota tujuan untuk konversi
   * @param city Kota tujuan
   */
  setToCity(city: City): void {
    this.selectedToCity.set(city);
    this.saveToStorage();
  }

  clearToCity(): void {
    this.selectedToCity.set(null);
    this.saveToStorage();
  }

  /**
   * Set waktu input manual
   * @param time Waktu dalam format HH:mm
   */
  setInputTime(time: string): void {
    this.inputTime.set(time);
    this.useCurrentTime.set(false);
    this.saveToStorage();
  }

  /**
   * Set tanggal input manual
   * @param date Tanggal dalam format YYYY-MM-DD
   */
  setInputDate(date: string): void {
    this.inputDate.set(date);
    this.useCurrentTime.set(false);
    this.saveToStorage();
  }

  /**
   * Toggle menggunakan waktu saat ini
   * @param useCurrent boolean untuk menggunakan waktu saat ini
   */
  setUseCurrentTime(useCurrent: boolean): void {
    this.useCurrentTime.set(useCurrent);
    this.saveToStorage();
  }

  refreshCurrentTime(): void {
    this.currentTime.set(new Date());
  }

  /**
   * Tukar posisi kota asal dan tujuan
   */
  swapCities(): void {
    const from = this.selectedFromCity();
    const to = this.selectedToCity();
    this.selectedFromCity.set(to);
    this.selectedToCity.set(from);
    this.saveToStorage();
  }

  private createDateFromInputs(timeZone: string): Date | null {
    const timeValue = this.inputTime();
    const dateValue = this.inputDate();
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeValue);

    if (!timeMatch || !this.isValidDate(dateValue)) {
      return null;
    }

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (hours > 23 || minutes > 59) {
      return null;
    }

    const wallClockUtc = Date.UTC(
      Number(dateValue.slice(0, 4)),
      Number(dateValue.slice(5, 7)) - 1,
      Number(dateValue.slice(8, 10)),
      hours,
      minutes
    );
    const offsetBefore = this.getTimeZoneOffsetMinutes(timeZone, new Date(wallClockUtc));
    const candidateBefore = wallClockUtc - offsetBefore * 60000;
    const offsetAfter = this.getTimeZoneOffsetMinutes(timeZone, new Date(candidateBefore));
    // Apply the post-transition offset so fall-back ambiguous times resolve to
    // their first occurrence; round-trip to reject nonexistent spring-forward gaps.
    const candidate = new Date(wallClockUtc - offsetAfter * 60000);
    const verificationOffset = this.getTimeZoneOffsetMinutes(timeZone, candidate);
    const roundTripWall = new Date(candidate.getTime() + verificationOffset * 60000);
    const inputYear = Number(dateValue.slice(0, 4));
    const inputMonth = Number(dateValue.slice(5, 7)) - 1;
    const inputDay = Number(dateValue.slice(8, 10));
    if (
      roundTripWall.getUTCFullYear() !== inputYear ||
      roundTripWall.getUTCMonth() !== inputMonth ||
      roundTripWall.getUTCDate() !== inputDay ||
      roundTripWall.getUTCHours() !== hours ||
      roundTripWall.getUTCMinutes() !== minutes
    ) {
      return null;
    }
    return candidate;
  }

  private todayLocalDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      !Number.isNaN(date.getTime()) &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  /**
   * Reset semua pilihan
   */
  reset(): void {
    this.selectedFromCity.set(null);
    this.selectedToCity.set(null);
    this.inputTime.set('00:00');
    this.inputDate.set(this.todayLocalDate());
    this.useCurrentTime.set(true);
    this.saveToStorage();
  }

  /**
   * Format waktu untuk display
   * @param date Objek Date
   * @param format Format waktu ('12h' atau '24h')
   * @returns String waktu yang diformat
   */
  formatTime(date: Date, format: '12h' | '24h' = '24h', timeZone = 'UTC'): string {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
      timeZone,
    }).format(date);
  }

  /**
   * Format tanggal untuk display
   * @param date Objek Date
   * @returns String tanggal yang diformat
   */
  formatDate(date: Date, timeZone = 'UTC'): string {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    }).format(date);
  }

  /**
   * Dapatkan informasi selisih zona waktu
   * @returns String yang menjelaskan selisih waktu
   */
  getOffsetInfo(): string {
    const result = this.convertedResult();
    if (!result) return '';

    const diff = result.offsetDifference;
    const sign = diff >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(diff));
    const minutes = Math.abs((diff % 1) * 60);

    if (minutes > 0) {
      return `${sign}${diff} jam (${hours}j ${minutes}m)`;
    }
    return `${sign}${diff} jam`;
  }

  getCityOffset(city: City, date = this.currentTime()): number {
    return this.getTimeZoneOffsetMinutes(getCityTimeZone(city), date) / 60;
  }

  getCityTimeZone(city: City): string {
    return getCityTimeZone(city);
  }

  private getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
    const offsetText = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;

    if (!offsetText) {
      throw new Error(`Unable to determine time zone offset for ${timeZone}`);
    }

    if (offsetText === 'GMT') return 0;

    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offsetText);
    if (!match) {
      throw new Error(`Unsupported time zone offset format "${offsetText}" for ${timeZone}`);
    }

    const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
    return match[1] === '+' ? minutes : -minutes;
  }

  private saveToStorage(): void {
    try {
      const data: TimezoneConverterStorage = {
        fromCity: this.selectedFromCity(),
        toCity: this.selectedToCity(),
        inputTime: this.inputTime(),
        inputDate: this.inputDate(),
        useCurrentTime: this.useCurrentTime(),
      };
      localStorage.setItem(TIMEZONE_CONVERTER_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(TIMEZONE_CONVERTER_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (!this.isValidStorage(parsed)) {
        return;
      }

      this.selectedFromCity.set(parsed.fromCity);
      this.selectedToCity.set(parsed.toCity);
      this.inputTime.set(parsed.inputTime || '00:00');
      this.inputDate.set(parsed.inputDate || this.todayLocalDate());
      this.useCurrentTime.set(parsed.useCurrentTime ?? true);
    } catch {
      // ignore storage errors
    }
  }

  private isValidStorage(candidate: unknown): candidate is TimezoneConverterStorage {
    if (typeof candidate !== 'object' || candidate === null) {
      return false;
    }

    const value = candidate as Record<string, unknown>;
    const fromCity = value['fromCity'];
    const toCity = value['toCity'];
    const inputTime = value['inputTime'];
    const inputDate = value['inputDate'];
    const useCurrentTime = value['useCurrentTime'];

    const isCity = (item: unknown): item is City =>
      this.hasCityShape(item) &&
      typeof item.name === 'string' &&
      typeof item.offset === 'number' &&
      typeof item.lat === 'number' &&
      typeof item.lon === 'number';

    return (
      (fromCity === null || isCity(fromCity)) &&
      (toCity === null || isCity(toCity)) &&
      typeof inputTime === 'string' &&
      typeof inputDate === 'string' &&
      typeof useCurrentTime === 'boolean'
    );
  }

  private hasCityShape(value: unknown): value is Partial<City> {
    return typeof value === 'object' && value !== null;
  }
}

interface TimezoneConverterStorage {
  fromCity: City | null;
  toCity: City | null;
  inputTime: string;
  inputDate: string;
  useCurrentTime: boolean;
}

// seseorag yang berharga tealha Aku terus bernapas
