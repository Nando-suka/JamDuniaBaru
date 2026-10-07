// language.service.ts
import { Injectable, signal, computed } from '@angular/core';

const LANGUAGE_STORAGE_KEY = 'jam-dunia-language';

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
    reset: 'Reset',
    notificationPermissionPrompt: 'Izinkan notifikasi untuk menerima alarm dan timer.',
    allowNotifications: 'Izinkan Notifikasi',
    notificationsBlocked: 'Notifikasi diblokir.',
    notificationHelp: 'Pelajari cara mengizinkan notifikasi',
    notificationsUnsupported: 'Notifikasi tidak didukung oleh browser ini.',
    noCitiesFound: 'Kota tidak ditemukan',
    matchingCities: 'Jumlah kota yang cocok: {count}',
    enabled: 'Aktif',
    paused: 'Dijeda',
    notificationsEnabled: 'Notifikasi diaktifkan',
    notificationBlockedToast: 'Notifikasi diblokir. Aktifkan melalui pengaturan browser.',
    favoriteAdded: 'ditambahkan ke favorit',
    favoriteRemoved: 'dihapus dari favorit',
    showAllCities: 'Tampilkan semua kota',
    noFavoriteCities: 'Belum ada kota favorit.',
    chooseCity: 'Pilih kota',
    selectedCity: 'Kota dipilih',
    noCitySelected: 'Belum ada kota dipilih',
    mapInstructions: 'Pilih kota pada peta untuk melihat waktu lokalnya.',
    mapZoomControls: 'Kontrol zoom peta',
    zoomIn: 'Perbesar peta',
    zoomOut: 'Perkecil peta',
    resetMapZoom: 'Atur ulang zoom',
      alarmPaused: 'Alarm dijeda',
      invalidAlarmTime: 'Waktu alarm tidak valid',
      noDateSet: 'Tanggal belum diatur',
      alarmPassed: 'Waktu alarm telah lewat',
      nextAlarm: 'Alarm berikutnya',
      today: 'Hari ini',
      tomorrow: 'Besok',
      noUpcomingAlarm: 'Tidak ada alarm mendatang',
      noRepeatConfiguration: 'Konfigurasi pengulangan belum diatur',
      alarmScheduledIn: 'Alarm dijadwalkan dalam',
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
    reset: 'Reset',
    notificationPermissionPrompt: 'Allow notifications to receive alarm and timer alerts.',
    allowNotifications: 'Allow Notifications',
    notificationsBlocked: 'Notifications are blocked.',
    notificationHelp: 'Learn how to allow notifications',
    notificationsUnsupported: 'Notifications are not supported by this browser.',
    noCitiesFound: 'No cities found',
    matchingCities: 'Matching cities: {count}',
    enabled: 'Enabled',
    paused: 'Paused',
    notificationsEnabled: 'Notifications enabled',
    notificationBlockedToast: 'Notifications are blocked. Enable them in browser settings.',
    favoriteAdded: 'added to favorites',
    favoriteRemoved: 'removed from favorites',
    showAllCities: 'Show all cities',
    noFavoriteCities: 'No favorite cities yet.',
    chooseCity: 'Choose a city',
    selectedCity: 'Selected city',
    noCitySelected: 'No city selected',
    mapInstructions: 'Choose a city on the map to view its local time.',
    mapZoomControls: 'Map zoom controls',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetMapZoom: 'Reset zoom',
      alarmPaused: 'Alarm is paused',
      invalidAlarmTime: 'Invalid alarm time',
      noDateSet: 'No date set',
      alarmPassed: 'Alarm time has passed',
      nextAlarm: 'Next alarm',
      today: 'Today',
      tomorrow: 'Tomorrow',
      noUpcomingAlarm: 'No upcoming alarm',
      noRepeatConfiguration: 'No repeat configuration',
      alarmScheduledIn: 'Alarm is scheduled in',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private browserLang = navigator.language.split('-')[0];
  currentLang = signal<'id' | 'en'>(this.getInitialLanguage());
  text = computed(() => translations[this.currentLang()]);

  private getInitialLanguage(): 'id' | 'en' {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as 'id' | 'en' | null;
      if (stored === 'id' || stored === 'en') {
        return stored;
      }
    } catch {
      // ignore localStorage errors
    }

    return this.browserLang === 'id' ? 'id' : 'en';
  }

  setLanguage(lang: 'id' | 'en') {
    this.currentLang.set(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  }
}
