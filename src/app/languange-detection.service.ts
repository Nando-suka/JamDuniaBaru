import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageDetectionService {
  constructor() {}

  detectBrowserLanguage(): string {
    const browserLanguage = navigator.language || navigator.languages[0];
    return browserLanguage.split('-')[0]; // Ambil kode bahasa (misalnya 'en' dari 'en-US')
  }

  detectLanguageByLocation(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by this browser.');
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const language = await this.getLanguageFromCoordinates(latitude, longitude);
          resolve(language);
        },
        (error) => {
          reject('Unable to retrieve location.');
        }
      );
    });
  }

  private async getLanguageFromCoordinates(lat: number, lng: number): Promise<string> {

    const response = await fetch(`https://api.geonames.org/countryCodeJSON?lat=${lat}&lng=${lng}&username=demo`);
    const data = await response.json();
    const countryCode = data.countryCode;

    const countryToLanguageMap: { [key: string]: string } = {
      US: 'en',
      ID: 'id',
      FR: 'fr',
      // Tambahkan lebih banyak peta negara ke bahasa
    };

    return countryToLanguageMap[countryCode] || 'en'; // Default ke 'en' jika tidak ditemukan
  }
}