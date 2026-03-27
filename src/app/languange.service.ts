// language.service.ts
import { Injectable, signal, computed } from '@angular/core';

export const translations = {
  id: {
    title: 'Jam Dunia Modern',
    loadMore: 'Muat Lebih Banyak',
    loading: 'Sedang memuat...',
    allLoaded: 'Semua kota telah dimuat!',
    scrollToTop: 'Kembali ke atas'
  },
  en: {
    title: 'Modern World Clock',
    loadMore: 'Load More',
    loading: 'Loading...',
    allLoaded: 'All cities loaded!',
    scrollToTop: 'Scroll to top'
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