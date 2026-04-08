import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { LanguageService } from './languange.service';
import { LanguageDetectionService } from './languange-detection.service';
import { ThemeService } from './theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit, OnDestroy {
  // Pakai Signal! Ini standar Angular masa depan
  currentTime = signal(new Date());
  langService = inject(LanguageService); // berhubungan dengan layanan languange
  detectionService = inject(LanguageDetectionService); // untuk deteksi bahasa otomatis
  themeService = inject(ThemeService); // untuk mengelola tema
  itemsToShow = signal(12); // Mulai tampil 12 item
  isLoading = signal(false); // Status loading
  private timer: any;

  dict = this.langService.text;
  locations = [
  { name: 'Honolulu', offset: -10 },   // Hawaii, AS
  { name: 'Anchorage', offset: -9 },   // Alaska, AS
  { name: 'Los Angeles', offset: -8 }, // Pantai Barat AS (PST)
  { name: 'Denver', offset: -7 },      // Pegunungan AS (MST)
  { name: 'Chicago', offset: -6 },     // Tengah AS (CST)
  { name: 'Mexico City', offset: -6 }, // Meksiko
  { name: 'New York', offset: -5 },    // Pantai Timur AS (EST)
  { name: 'Toronto', offset: -5 },     // Kanada
  { name: 'Santiago', offset: -4 },    // Chile
  { name: 'Sao Paulo', offset: -3 },   // Brasil
  { name: 'Buenos Aires', offset: -3 },// Argentina

  // --- EROPA & AFRIKA (Garis Tengah) ---
  { name: 'Reykjavik', offset: 0 },    // Islandia
  { name: 'London', offset: 0 },       // Inggris (GMT)
  { name: 'Casablanca', offset: 1 },   // Maroko
  { name: 'Paris', offset: 1 },        // Prancis (CET)
  { name: 'Berlin', offset: 1 },       // Jerman (CET)
  { name: 'Rome', offset: 1 },         // Italia (CET)
  { name: 'Lagos', offset: 1 },        // Nigeria
  { name: 'Cape Town', offset: 2 },    // Afrika Selatan
  { name: 'Cairo', offset: 2 },        // Mesir
  { name: 'Athens', offset: 2 },       // Yunani
  { name: 'Istanbul', offset: 3 },     // Turki
  { name: 'Moscow', offset: 3 },       // Rusia
  { name: 'Riyadh', offset: 3 },       // Arab Saudi
  { name: 'Nairobi', offset: 3 },      // Kenya
  { name: 'Betlehem', offset: 5},      // Israel

  // --- ASIA & TIMUR TENGAH ---
  { name: 'Dubai', offset: 4 },        // Uni Emirat Arab
  { name: 'Tehran', offset: 3.5 },     // Iran
  { name: 'Karachi', offset: 5 },      // Pakistan
  { name: 'Mumbai', offset: 5.5 },     // India
  { name: 'Kathmandu', offset: 5.75 }, // Nepal (Offset unik!)
  { name: 'Manama', offset: 6},        // Bahrain
  { name: 'Dhaka', offset: 6 },        // Bangladesh
  { name: 'Bangkok', offset: 7 },      // Thailand
  { name: 'Jakarta', offset: 7 },      // Indonesia (WIB)
  { name: 'Singapore', offset: 8 },    // Singapura
  { name: 'Kuala Lumpur', offset: 8 }, // Malaysia
  { name: 'Hong Kong', offset: 8 },    // Hong Kong
  { name: 'Beijing', offset: 8 },      // China
  { name: 'Bali', offset: 8 },         // Indonesia (WITA)
  { name: 'Perth', offset: 8 },        // Australia Barat
  { name: 'Tokyo', offset: 9 },   
  { name: 'Osaka', offset: 9},
  { name: 'Kyoto', offset: 9},     // Jepang
  { name: 'Seoul', offset: 9 },        // Korea Selatan
  { name: 'Jayapura', offset: 9 },     // Indonesia (WIT)
  { name: 'Adelaide', offset: 9.5 },   // Australia Tengah

  // --- PASIFIK & AUSTRALIA ---
  { name: 'Sydney', offset: 10 },      // Australia Timur
  { name: 'Guam', offset: 10 },        // Teritori AS
  { name: 'Auckland', offset: 12 },    // Selandia Baru
  { name: 'Fiji', offset: 12 }         // Fiji
  ];

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

  getCityTime(offset: number): Date {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (offset * 3600000));
  }

  getTimeByOffset(offset: number): Date {
    const d = this.currentTime(); // Ambil nilai signal dengan tanda kurung ()
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * offset));
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Scroll halus
    });
  }

  loadMore() {
    this.isLoading.set(true);
    
    // Simulasi loading selama 2 detik
    setTimeout(() => {
      this.itemsToShow.update(current => current + 12); // Tambah 12 item
      this.isLoading.set(false);
    }, 2000);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}