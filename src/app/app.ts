import { Component, OnInit, OnDestroy, signal } from '@angular/core';
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
  private timer: any;

  locations = [
    { name: 'Jakarta', offset: 7 },
    { name: 'Tokyo', offset: 9 },
    { name: 'London', offset: 0 },
    { name: 'New York', offset: -5 }
  ];

  ngOnInit() {
    this.timer = setInterval(() => {
      // Cara update signal: .set()
      this.currentTime.set(new Date());
    }, 1000);
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

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}