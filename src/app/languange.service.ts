// language.service.ts
import { Injectable, signal, computed } from '@angular/core';

export const translations = {
  id: {
    title: 'Jam Dunia Modern',
    loadMore: 'Muat Lebih Banyak',
    loading: 'Sedang memuat...',
    allLoaded: 'Semua kota telah dimuat!',
    scrollToTop: 'Kembali ke atas',
    // Timezone Converter
    timezoneConverter: 'Konverter Zona Waktu',
    fromCity: 'Dari Kota',
    toCity: 'Ke Kota',
    selectCity: 'Pilih kota...',
    useCurrentTime: 'Gunakan waktu saat ini',
    time: 'Waktu',
    date: 'Tanggal',
    timeDifference: 'Selisih waktu',
    from: 'Dari',
    to: 'Ke',
    selectBothCities: 'Pilih kota asal dan tujuan',
    reset: 'Reset'
  },
  en: {
    title: 'Modern World Clock',
    loadMore: 'Load More',
    loading: 'Loading...',
    allLoaded: 'All cities loaded!',
    scrollToTop: 'Scroll to top',
    // Timezone Converter
    timezoneConverter: 'Timezone Converter',
    fromCity: 'From City',
    toCity: 'To City',
    selectCity: 'Select city...',
    useCurrentTime: 'Use current time',
    time: 'Time',
    date: 'Date',
    timeDifference: 'Time difference',
    from: 'From',
    to: 'To',
    selectBothCities: 'Select source and destination cities',
    reset: 'Reset'
  }
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private browserLang = navigator.language.split('-')[0];
  currentLang = signal<'id' | 'en'>(this.browserLang === 'id' ? 'id' : 'en');
  text = computed(() => translations[this.currentLang()]);

  setLanguage(lang: 'id' | 'en') {
    this.currentLang.set(lang);
  }
}