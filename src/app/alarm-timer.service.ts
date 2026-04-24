import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlarmTimerService {
  private document = inject(DOCUMENT);

  private alarmTimeouts = new Map<string, any>();

  // ===== STATE =====
  alarms = signal<Alarm[]>([]);

  // SEBELUM:
  // activeTimer = signal<Timer | null>(null);

  // SESUDAH:
  timers = signal<Timer[]>([]);
  private timerIntervals = new Map<string, any>();
  notificationPermission = signal<NotificationPermission>('default');

  constructor() {
    this.checkNotificationPermission();
    this.loadAlarmsFromStorage();
  }

  // =====================================================
  // ===== NOTIFICATION METHODS ==========================
  // =====================================================

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

  private sendNotification(
    title: string,
    body: string,
    icon?: string
  ): void {
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

  // =====================================================
  // ===== ALARM METHODS =================================
  // =====================================================

  addAlarm(
    time: string,
    label: string = 'Alarm',
    repeat: boolean = true
  ): void {
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
    if (this.alarmTimeouts.has(id)) {
      clearTimeout(this.alarmTimeouts.get(id));
      this.alarmTimeouts.delete(id);
    }

    this.alarms.update(alarms =>
      alarms.filter(a => a.id !== id)
    );

    this.saveAlarmsToStorage();
  }

  toggleAlarm(id: string): void {
    this.alarms.update(alarms =>
      alarms.map(alarm => {
        if (alarm.id !== id) return alarm;

        const updatedAlarm = {
          ...alarm,
          enabled: !alarm.enabled
        };

        if (updatedAlarm.enabled) {
          this.scheduleAlarm(updatedAlarm);
        } else {
          if (this.alarmTimeouts.has(id)) {
            clearTimeout(this.alarmTimeouts.get(id));
            this.alarmTimeouts.delete(id);
          }
        }

        return updatedAlarm;
      })
    );

    this.saveAlarmsToStorage();
  }

  private scheduleAlarm(alarm: Alarm): void {
    if (!alarm.enabled) return;

    const [hours, minutes] = alarm.time.split(':').map(Number);

    const now = new Date();
    const alarmTime = new Date(now);

    alarmTime.setHours(hours, minutes, 0, 0);

    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const timeUntilAlarm =
      alarmTime.getTime() - now.getTime();

    if (this.alarmTimeouts.has(alarm.id)) {
      clearTimeout(this.alarmTimeouts.get(alarm.id));
    }

    const timeoutRef = setTimeout(() => {
      this.triggerAlarm(alarm);

      if (alarm.repeat && alarm.enabled) {
        this.scheduleAlarm(alarm);
      }
    }, timeUntilAlarm);

    this.alarmTimeouts.set(alarm.id, timeoutRef);
  }

  private triggerAlarm(alarm: Alarm): void {
    this.sendNotification(
      'Alarm!',
      `Waktunya: ${alarm.label}`,
      '/favicon.ico'
    );

    this.playAlarmSound();
  }

  private playAlarmSound(): void {
    if ('AudioContext' in window) {
      const audioContext = new (
        window.AudioContext ||
        (window as any).webkitAudioContext
      )();

      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(
        800,
        audioContext.currentTime
      );

      gainNode.gain.setValueAtTime(
        0.1,
        audioContext.currentTime
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }

  // =====================================================
  // ===== MULTIPLE TIMER METHODS ========================
  // =====================================================

  startTimer(
    duration: number,
    label: string = 'Timer'
  ): void {
    const timer: Timer = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      duration,
      remaining: duration,
      label,
      endTime: Date.now() + (duration * 1000),
      isRunning: true
    };

    this.timers.update(timers => [...timers, timer]);

    this.runTimer(timers.id);
  }

  stopTimer(id: string): void {
    this.activeTimers.update(timers =>
      timers.filter(timer => timer.id !== id)
    );
  }

  pauseTimer(id: string): void {
    this.activeTimers.update(timers =>
      timers.map(timer =>
        timer.id === id
          ? {
              ...timer,
              isRunning: false
            }
          : timer
      )
    );
  }

  resumeTimer(id: string): void {
    const timer = this.timers()
      .find(t => t.id === id);

    if (!timer) return;

    const updatedTimer: Timer = {
      ...timer,
      isRunning: true,
      endTime:
        Date.now() + (timer.remaining * 1000)
    };

    this.timers.update(timers =>
      timers.map(t =>
        t.id === id
          ? updatedTimer
          : t
      )
    );

    this.runTimer(updatedTimer);
  }

  private runTimer(timer: Timer): void {
    const interval = setInterval(() => {
      const current =
        this.activeTimers()
          .find(t => t.id === timer.id);

      if (!current || !current.isRunning) {
        clearInterval(interval);
        return;
      }

      const remaining = Math.max(
        0,
        Math.floor(
          (current.endTime - Date.now()) / 1000
        )
      );

      if (remaining <= 0) {
        clearInterval(interval);
        this.triggerTimer(current);
        return;
      }

      this.activeTimers.update(timers =>
        timers.map(t =>
          t.id === timer.id
            ? {
                ...t,
                remaining
              }
            : t
        )
      );
    }, 1000);
  }

  private triggerTimer(timer: Timer): void {
    this.sendNotification(
      'Timer Selesai!',
      `Timer "${timer.label}" telah selesai`,
      '/favicon.ico'
    );

    this.playAlarmSound();

    this.activeTimers.update(timers =>
      timers.filter(t => t.id !== timer.id)
    );
  }

  // =====================================================
  // ===== STORAGE METHODS ===============================
  // =====================================================

  private saveAlarmsToStorage(): void {
    try {
      localStorage.setItem(
        'jam-dunia-alarms',
        JSON.stringify(this.alarms())
      );
    } catch (error) {
      console.error(
        'Error saving alarms to storage:',
        error
      );
    }
  }

  private loadAlarmsFromStorage(): void {
    try {
      const stored =
        localStorage.getItem(
          'jam-dunia-alarms'
        );

      if (stored) {
        const alarms: Alarm[] =
          JSON.parse(stored);

        this.alarms.set(alarms);

        alarms.forEach(alarm => {
          if (alarm.enabled) {
            this.scheduleAlarm(alarm);
          }
        });
      }
    } catch (error) {
      console.error(
        'Error loading alarms from storage:',
        error
      );
    }
  }

  // =====================================================
  // ===== UTILITY METHODS ===============================
  // =====================================================

  formatTime(seconds: number): string {
    const hours =
      Math.floor(seconds / 3600);

    const minutes =
      Math.floor(
        (seconds % 3600) / 60
      );

    const secs =
      seconds % 60;

    if (hours > 0) {
      return `${hours
        .toString()
        .padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes
      .toString()
      .padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
}

// =====================================================
// ===== INTERFACES =====================================
// =====================================================

export interface Alarm {
  id: string;
  time: string;
  label: string;
  repeat: boolean;
  enabled: boolean;
}

export interface Timer {
  id: string;
  duration: number;
  remaining: number;
  label: string;
  endTime: number;
  isRunning: boolean;

  // tambahan untuk multi timer
  intervalRef?: any;
}