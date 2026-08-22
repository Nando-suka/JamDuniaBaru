import { Injectable, signal, computed } from '@angular/core';
import { City } from './search.service';

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
  inputDate = signal<string>(new Date().toISOString().split('T')[0]);
  useCurrentTime = signal<boolean>(true);

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
      ? this.getCurrentTimeForOffset(from.offset)
      : this.createDateFromInputs(from.offset);

    if (!sourceDate || isNaN(sourceDate.getTime())) {
      return null;
    }

    // Hitung perbedaan offset
    const offsetDiff = to.offset - from.offset;

    // Konversi waktu berdasarkan selisih offset
    const convertedDate = new Date(sourceDate.getTime() + offsetDiff * 60 * 60 * 1000);

    return {
      fromCity: from,
      toCity: to,
      sourceTime: sourceDate,
      convertedTime: convertedDate,
      offsetDifference: offsetDiff,
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

  /**
   * Set kota tujuan untuk konversi
   * @param city Kota tujuan
   */
  setToCity(city: City): void {
    this.selectedToCity.set(city);
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

  private getCurrentTimeForOffset(offset: number): Date {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + offset * 3600000);
  }

  private createDateFromInputs(offset: number): Date | null {
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

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    date.setUTCHours(hours - offset, minutes, 0, 0);
    return date;
  }

  private isValidDate(value: string): boolean {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  /**
   * Reset semua pilihan
   */
  reset(): void {
    this.selectedFromCity.set(null);
    this.selectedToCity.set(null);
    this.inputTime.set('00:00');
    this.inputDate.set(new Date().toISOString().split('T')[0]);
    this.useCurrentTime.set(true);
    this.saveToStorage();
  }

  /**
   * Format waktu untuk display
   * @param date Objek Date
   * @param format Format waktu ('12h' atau '24h')
   * @returns String waktu yang diformat
   */
  formatTime(date: Date, format: '12h' | '24h' = '24h'): string {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
      timeZone: 'UTC',
    }).format(date);
  }

  /**
   * Format tanggal untuk display
   * @param date Objek Date
   * @returns String tanggal yang diformat
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
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
      this.inputDate.set(parsed.inputDate || new Date().toISOString().split('T')[0]);
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
