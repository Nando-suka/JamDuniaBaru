import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlarmTimerService {
  private alarmTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  alarms = signal<Alarm[]>([]);
  timers = signal<Timer[]>([]);
  activeTimers = computed(() => this.timers().filter((timer) => timer.remaining > 0));
  private timerIntervals = new Map<string, ReturnType<typeof setInterval>>();
  notificationPermission = signal<NotificationPermission>('default');

  constructor() {
    this.checkNotificationPermission();
    this.loadAlarmsFromStorage();
  }

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
        tag: 'jam-dunia-alarm',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  addAlarm(
    time: string,
    label: string = 'Alarm',
    repeat: boolean = true,
    repeatDays: AlarmDay[] = [],
    sound: string = 'chime',
    snoozeMinutes: number = 5,
    date?: string
  ): void {
    const alarm: Alarm = {
      id: Date.now().toString(),
      time,
      label,
      repeat,
      repeatDays,
      sound,
      snoozeMinutes,
      date,
      enabled: true,
    };

    this.alarms.update((alarms) => [...alarms, alarm]);
    this.saveAlarmsToStorage();
    this.scheduleAlarm(alarm);
  }

  updateAlarm(
    id: string,
    time: string,
    label: string,
    repeat: boolean,
    repeatDays: AlarmDay[],
    sound: string,
    snoozeMinutes: number,
    date?: string
  ): void {
    if (this.alarmTimeouts.has(id)) {
      clearTimeout(this.alarmTimeouts.get(id));
      this.alarmTimeouts.delete(id);
    }

    this.alarms.update((alarms) =>
      alarms.map((a) =>
        a.id === id
          ? { ...a, time, label, repeat, repeatDays, sound, snoozeMinutes, date, enabled: true }
          : a
      )
    );

    this.saveAlarmsToStorage();

    const updated = this.alarms().find((a) => a.id === id);
    if (updated?.enabled) {
      this.scheduleAlarm(updated);
    }
  }

  removeAlarm(id: string): void {
    if (this.alarmTimeouts.has(id)) {
      clearTimeout(this.alarmTimeouts.get(id));
      this.alarmTimeouts.delete(id);
    }

    this.alarms.update((alarms) => alarms.filter((a) => a.id !== id));
    this.saveAlarmsToStorage();
  }

  toggleAlarm(id: string): void {
    this.alarms.update((alarms) =>
      alarms.map((alarm) => {
        if (alarm.id !== id) return alarm;

        const updatedAlarm = {
          ...alarm,
          enabled: !alarm.enabled,
        };

        if (updatedAlarm.enabled) {
          this.scheduleAlarm(updatedAlarm);
        } else if (this.alarmTimeouts.has(id)) {
          clearTimeout(this.alarmTimeouts.get(id));
          this.alarmTimeouts.delete(id);
        }

        return updatedAlarm;
      })
    );

    this.saveAlarmsToStorage();
  }

  snoozeAlarm(id: string, minutes: number = 5): void {
    const alarm = this.alarms().find((entry) => entry.id === id);
    if (!alarm) return;

    if (this.alarmTimeouts.has(id)) {
      clearTimeout(this.alarmTimeouts.get(id));
      this.alarmTimeouts.delete(id);
    }

    const timeoutRef = window.setTimeout(() => {
      this.alarmTimeouts.delete(id);
      const currentAlarm = this.alarms().find((entry) => entry.id === id);
      if (!currentAlarm?.enabled) {
        return;
      }

      this.triggerAlarm(currentAlarm);
      if (currentAlarm.repeat || currentAlarm.repeatDays?.length) {
        this.scheduleAlarm(currentAlarm);
      }
    }, Math.max(60000, minutes * 60 * 1000));

    this.alarmTimeouts.set(id, timeoutRef);
    this.saveAlarmsToStorage();
  }

  private scheduleAlarm(alarm: Alarm): void {
    if (!alarm.enabled) return;

    const now = new Date();
    const nextAlarmTime = this.getNextAlarmTime(alarm, now);
    const timeUntilAlarm = nextAlarmTime.getTime() - now.getTime();

    if (this.alarmTimeouts.has(alarm.id)) {
      clearTimeout(this.alarmTimeouts.get(alarm.id));
    }

    const timeoutRef = window.setTimeout(() => {
      this.alarmTimeouts.delete(alarm.id);
      this.triggerAlarm(alarm);

      if ((alarm.repeat || alarm.repeatDays?.length) && alarm.enabled) {
        this.scheduleAlarm(alarm);
      }
    }, Math.max(1000, timeUntilAlarm));

    this.alarmTimeouts.set(alarm.id, timeoutRef);
  }

  private getNextAlarmTime(alarm: Alarm, now: Date): Date {
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const dayNames: AlarmDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const selectedDays = alarm.repeatDays?.length ? alarm.repeatDays : alarm.repeat ? dayNames : [];

    if (!selectedDays.length && alarm.date) {
      const candidate = new Date(`${alarm.date}T00:00:00`);
      candidate.setHours(hours, minutes, 0, 0);
      return candidate;
    }

    if (selectedDays.length > 0) {
      for (let offset = 0; offset < 8; offset++) {
        const candidate = new Date(now);
        candidate.setDate(now.getDate() + offset);
        candidate.setHours(hours, minutes, 0, 0);

        if (selectedDays.includes(dayNames[candidate.getDay()]) && candidate > now) {
          return candidate;
        }
      }
    }

    const nextDay = new Date(now);
    nextDay.setHours(hours, minutes, 0, 0);

    if (nextDay > now) {
      return nextDay;
    }

    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  }

  private triggerAlarm(alarm: Alarm): void {
    this.sendNotification('Alarm!', `Waktunya: ${alarm.label}`, '/favicon.ico');
    this.playAlarmSound(alarm.sound);
  }

  private playAlarmSound(sound: string = 'chime'): void {
    if (!('AudioContext' in window)) {
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const frequencyMap: Record<string, [number, number]> = {
      chime: [880, 1320],
      digital: [1046, 783],
      sunrise: [523, 659],
      gentle: [440, 554],
    };

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const [startFreq, endFreq] = frequencyMap[sound as keyof typeof frequencyMap] || frequencyMap['chime'];
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, audioContext.currentTime + 0.7);
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.9);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.9);
  }

  startTimer(duration: number, label: string = 'Timer'): void {
    const timer: Timer = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      duration,
      remaining: duration,
      label,
      endTime: Date.now() + duration * 1000,
      isRunning: true,
    };

    this.timers.update((timers) => [...timers, timer]);
    this.runTimer(timer);
  }

  stopTimer(id: string): void {
    this.clearTimerInterval(id);
    this.timers.update((timers) => timers.filter((timer) => timer.id !== id));
  }

  pauseTimer(id: string): void {
    this.clearTimerInterval(id);
    this.timers.update((timers) =>
      timers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              isRunning: false,
            }
          : timer
      )
    );
  }

  resumeTimer(id: string): void {
    const timer = this.timers().find((t) => t.id === id);

    if (!timer) return;

    const updatedTimer: Timer = {
      ...timer,
      isRunning: true,
      endTime: Date.now() + timer.remaining * 1000,
    };

    this.timers.update((timers) => timers.map((t) => (t.id === id ? updatedTimer : t)));
    this.runTimer(updatedTimer);
  }

  private runTimer(timer: Timer): void {
    this.clearTimerInterval(timer.id);

    const interval = window.setInterval(() => {
      const existingTimer = this.timers().find((t) => t.id === timer.id);
      if (!existingTimer || !existingTimer.isRunning) {
        this.clearTimerInterval(timer.id);
        return;
      }

      const remaining = Math.max(0, Math.floor((existingTimer.endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        this.clearTimerInterval(timer.id);
        this.triggerTimer(existingTimer);
        return;
      }

      this.timers.update((timers) =>
        timers.map((t) =>
          t.id === timer.id
            ? {
                ...t,
                remaining,
              }
            : t
        )
      );
    }, 1000);

    this.timerIntervals.set(timer.id, interval);
  }

  private triggerTimer(timer: Timer): void {
    this.sendNotification('Timer Selesai!', `Timer "${timer.label}" telah selesai`, '/favicon.ico');
    this.playAlarmSound();
    this.clearTimerInterval(timer.id);
    this.timers.update((timers) => timers.filter((t) => t.id !== timer.id));
  }

  private clearTimerInterval(id: string): void {
    const interval = this.timerIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(id);
    }
  }

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
        const alarms = JSON.parse(stored) as Alarm[];
        const normalized = alarms.map((alarm) => ({
          ...alarm,
          repeatDays: alarm.repeatDays ?? [],
          sound: alarm.sound ?? 'chime',
          snoozeMinutes: alarm.snoozeMinutes ?? 5,
        }));

        this.alarms.set(normalized);

        normalized.forEach((alarm) => {
          if (alarm.enabled) {
            this.scheduleAlarm(alarm);
          }
        });
      }
    } catch (error) {
      console.error('Error loading alarms from storage:', error);
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export type AlarmDay = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface Alarm {
  id: string;
  time: string;
  label: string;
  repeat: boolean;
  repeatDays?: AlarmDay[];
  sound?: string;
  snoozeMinutes?: number;
  date?: string;
  enabled: boolean;
}

export interface Timer {
  id: string;
  duration: number;
  remaining: number;
  label: string;
  endTime: number;
  isRunning: boolean;
  intervalRef?: any;
}
