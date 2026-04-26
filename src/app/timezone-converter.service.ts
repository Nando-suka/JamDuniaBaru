import { Injectable, signal, computed } from '@angular/core';
import { City } from './search.service';

export interface TimeConversion {
  fromCity: City;
  toCity: City;
  sourceTime: Date;
  convertedTime: Date;
  offsetDifference: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimezoneConverterService {
  
  // State untuk konverter
  selectedFromCity = signal<City | null>(null);
  selectedToCity = signal<City | null>(null);
  inputTime = signal<string>('00:00');
  inputDate = signal<string>(new Date().toISOString().split('T')[0]);
  useCurrentTime = signal<boolean>(true);

  // Computed: hasil konversi waktu
  convertedResult = computed(() => {
    const from = this.selectedFromCity();
    const to = this.selectedToCity();
    
    if (!from || !to) {
      return null;
    }

    let sourceDate: Date;
    
    if (this.useCurrentTime()) {
      sourceDate = new Date();
    } else {
      // Parse input time dan date
      const [hours, minutes] = this.inputTime().split(':').map(Number);
      sourceDate = new Date(this.inputDate());
      sourceDate.setHours(hours, minutes, 0, 0);
    }

    // Hitung perbedaan offset
    const offsetDiff = to.offset - from.offset;
    
    // Konversi waktu
    const convertedDate = new Date(sourceDate.getTime() + offsetDiff * 60 * 60 * 1000);

    return {
      fromCity: from,
      toCity: to,
      sourceTime: sourceDate,
      convertedTime: convertedDate,
      offsetDifference: offsetDiff
    } as TimeConversion;
  });

  /**
   * Set kota asal untuk konversi
   * @param city Kota asal
   */
  setFromCity(city: City): void {
    this.selectedFromCity.set(city);
  }

  /**
   * Set kota tujuan untuk konversi
   * @param city Kota tujuan
   */
  setToCity(city: City): void {
    this.selectedToCity.set(city);
  }

  /**
   * Set waktu input manual
   * @param time Waktu dalam format HH:mm
   */
  setInputTime(time: string): void {
    this.inputTime.set(time);
    this.useCurrentTime.set(false);
  }

  /**
   * Set tanggal input manual
   * @param date Tanggal dalam format YYYY-MM-DD
   */
  setInputDate(date: string): void {
    this.inputDate.set(date);
    this.useCurrentTime.set(false);
  }

  /**
   * Toggle menggunakan waktu saat ini
   * @param useCurrent boolean untuk menggunakan waktu saat ini
   */
  setUseCurrentTime(useCurrent: boolean): void {
    this.useCurrentTime.set(useCurrent);
  }

  /**
   * Tukar posisi kota asal dan tujuan
   */
  swapCities(): void {
    const from = this.selectedFromCity();
    const to = this.selectedToCity();
    this.selectedFromCity.set(to);
    this.selectedToCity.set(from);
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
  }

  /**
   * Format waktu untuk display
   * @param date Objek Date
   * @param format Format waktu ('12h' atau '24h')
   * @returns String waktu yang diformat
   */
  formatTime(date: Date, format: '12h' | '24h' = '24h'): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Format tanggal untuk display
   * @param date Objek Date
   * @returns String tanggal yang diformat
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
}