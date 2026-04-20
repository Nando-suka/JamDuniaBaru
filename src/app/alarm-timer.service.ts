import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AlarmTimerService {
  private document = inject(DOCUMENT);

  // Signals untuk state
  alarms = signal<Alarm[]>([]);
  activeTimer = signal<Timer | null>(null);
  notificationPermission = signal<NotificationPermission>('default');

  constructor() {
    this.checkNotificationPermission();
    this.loadAlarmsFromStorage();
  }

  // ===== NOTIFICATION METHODS =====
  async checkNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
      this.notificationPermission.set(Notification.permission);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser tidak mendukung Notification API');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission.set(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private sendNotification(title: string, body: string, icon?: string): void {
    if (this.notificationPermission() !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'jam-dunia-alarm'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // ===== ALARM METHODS =====
  addAlarm(time: string, label: string = 'Alarm', repeat: boolean = true): void {
    const alarm: Alarm = {
      id: Date.now().toString(),
      time,
      label,
      repeat,
      enabled: true
    };

    this.alarms.update(alarms => [...alarms, alarm]);
    this.saveAlarmsToStorage();
    this.scheduleAlarm(alarm);
  }

  removeAlarm(id: string): void {
    this.alarms.update(alarms => alarms.filter(a => a.id !== id));
    this.saveAlarmsToStorage();
  }

  toggleAlarm(id: string): void {
    this.alarms.update(alarms =>
      alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
    this.saveAlarmsToStorage();
  }

  private scheduleAlarm(alarm: Alarm): void {
    if (!alarm.enabled) return;

    const [hours, minutes] = alarm.time.split(':').map(Number);
    const now = new Date();
    const alarmTime = new Date(now);
    alarmTime.setHours(hours, minutes, 0, 0);

    // Jika waktu alarm sudah lewat hari ini, set untuk besok
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const timeUntilAlarm = alarmTime.getTime() - now.getTime();

    setTimeout(() => {
      this.triggerAlarm(alarm);
      if (alarm.repeat) {
        // Schedule ulang untuk hari berikutnya
        this.scheduleAlarm(alarm);
      }
    }, timeUntilAlarm);
  }

  private triggerAlarm(alarm: Alarm): void {
    this.sendNotification('Alarm!', `Waktunya: ${alarm.label}`, '/favicon.ico');

    // Play sound if available
    this.playAlarmSound();
  }

  private playAlarmSound(): void {
    // Simple beep sound
    if ('AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }

  // ===== TIMER METHODS =====
  startTimer(duration: number, label: string = 'Timer'): void {
    if (this.activeTimer()) {
      this.stopTimer();
    }

    const endTime = Date.now() + (duration * 1000);
    const timer: Timer = {
      id: Date.now().toString(),
      duration,
      remaining: duration,
      label,
      endTime,
      isRunning: true
    };

    this.activeTimer.set(timer);
    this.runTimer(timer);
  }

  stopTimer(): void {
    if (this.activeTimer()) {
      this.activeTimer.set(null);
    }
  }

  pauseTimer(): void {
    this.activeTimer.update(timer => timer ? { ...timer, isRunning: false } : null);
  }

  resumeTimer(): void {
    const timer = this.activeTimer();
    if (timer && !timer.isRunning) {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((timer.endTime - now) / 1000));
      this.activeTimer.update(t => t ? { ...t, remaining, isRunning: true } : null);
      this.runTimer(timer);
    }
  }

  private runTimer(timer: Timer): void {
    const interval = setInterval(() => {
      const currentTimer = this.activeTimer();
      if (!currentTimer || currentTimer.id !== timer.id || !currentTimer.isRunning) {
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      const remaining = Math.max(0, Math.floor((currentTimer.endTime - now) / 1000));

      if (remaining <= 0) {
        this.triggerTimer(currentTimer);
        clearInterval(interval);
        return;
      }

      this.activeTimer.update(t => t ? { ...t, remaining } : null);
    }, 1000);
  }

  private triggerTimer(timer: Timer): void {
    this.sendNotification('Timer Selesai!', `Timer "${timer.label}" telah selesai`, '/favicon.ico');
    this.playAlarmSound();
    this.activeTimer.set(null);
  }

  // ===== STORAGE METHODS =====
  private saveAlarmsToStorage(): void {
    try {
      localStorage.setItem('jam-dunia-alarms', JSON.stringify(this.alarms()));
    } catch (error) {
      console.error('Error saving alarms to storage:', error);
    }
  }

  private loadAlarmsFromStorage(): void {
    try {
      const stored = localStorage.getItem('jam-dunia-alarms');
      if (stored) {
        const alarms: Alarm[] = JSON.parse(stored);
        this.alarms.set(alarms);
        // Schedule alarms yang masih aktif
        alarms.forEach(alarm => {
          if (alarm.enabled) {
            this.scheduleAlarm(alarm);
          }
        });
      }
    } catch (error) {
      console.error('Error loading alarms from storage:', error);
    }
  }

  // ===== UTILITY METHODS =====
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export interface Alarm {
  id: string;
  time: string; // HH:MM format
  label: string;
  repeat: boolean;
  enabled: boolean;
}

export interface Timer {
  id: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  label: string;
  endTime: number; // timestamp
  isRunning: boolean;
}