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

  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

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
    if (!this.isNotificationSupported()) {
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

    const AudioContextCtor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const audioContext = new AudioContextCtor();
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
    if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration <= 0) {
      return;
    }

    const timer: Timer = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      duration,
      remaining: duration,
      label,
      endTime: Date.now() + duration * 1000,
      isRunning: true,
      state: 'running',
    };

    this.timers.update((timers) => [...timers, timer]);
    this.runTimer(timer);
  }

  stopTimer(id: string): void {
    this.clearTimerInterval(id);
    this.timers.update((timers) =>
      timers.map((timer) =>
        timer.id === id ? { ...timer, isRunning: false, remaining: 0, state: 'stopped' } : timer
      )
    );
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
              state: 'paused',
            }
          : timer
      )
    );
  }

  resumeTimer(id: string): void {
    const timer = this.timers().find((t) => t.id === id);

    if (!timer || timer.state === 'expired' || timer.state === 'stopped') return;

    const updatedTimer: Timer = {
      ...timer,
      isRunning: true,
      state: 'running',
      endTime: Date.now() + timer.remaining * 1000,
    };

    this.timers.update((timers) => timers.map((t) => (t.id === id ? updatedTimer : t)));
    this.runTimer(updatedTimer);
  }

  private runTimer(timer: Timer): void {
    this.clearTimerInterval(timer.id);

    const interval = window.setInterval(() => {
      const existingTimer = this.timers().find((t) => t.id === timer.id);
      if (!existingTimer || !existingTimer.isRunning || existingTimer.state !== 'running') {
        this.clearTimerInterval(timer.id);
        return;
      }

      const remaining = Math.max(0, Math.floor((existingTimer.endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        this.clearTimerInterval(timer.id);
        this.expireTimer(existingTimer.id);
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

  private expireTimer(id: string): void {
    const timer = this.timers().find((t) => t.id === id);
    if (!timer || timer.state === 'expired' || timer.state === 'stopped') {
      this.clearTimerInterval(id);
      return;
    }

    const expired: Timer = { ...timer, remaining: 0, isRunning: false, state: 'expired' };
    this.timers.update((timers) => timers.map((t) => (t.id === id ? expired : t)));
    this.sendNotification('Timer Selesai!', `Timer "${timer.label}" telah selesai`, '/favicon.ico');
    this.playAlarmSound();

    window.setTimeout(() => {
      this.timers.update((timers) =>
        timers.filter((t) => !(t.id === id && t.state === 'expired'))
      );
    }, 0);
  }

  private   clearTimerInterval(id: string): void {
    const interval = this.timerIntervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.timerIntervals.delete(id);
    }
  }

  private isValidTime(time: unknown): time is string {
    return (
      typeof time === 'string' &&
      /^\d{2}:\d{2}$/.test(time) &&
      Number(time.split(':')[0]) >= 0 &&
      Number(time.split(':')[0]) <= 23 &&
      Number(time.split(':')[1]) >= 0 &&
      Number(time.split(':')[1]) <= 59
    );
  }

  private isValidDate(date: unknown): date is string {
    if (typeof date !== 'string') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const y = Number(date.slice(0, 4));
    const m = Number(date.slice(5, 7));
    const d = Number(date.slice(8, 10));
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return !Number.isNaN(dateObj.getTime()) && dateObj.getUTCFullYear() === y && dateObj.getUTCMonth() === m - 1 && dateObj.getUTCDate() === d;
  }

  private isValidAlarmDay(day: unknown): day is AlarmDay {
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].includes(day as AlarmDay);
  }

  private filterValidAlarms(alarms: unknown[]): Array<Alarm> {
    const valid: Alarm[] = [];
    for (const raw of alarms) {
      if (!this.isAlarmShape(raw)) continue;
      const record: Partial<Alarm> = raw;
      const id = record.id;
      const time = record.time;
      const label = record.label;
      const repeat = record.repeat ?? false;
      const repeatDays = record.repeatDays ?? [];
      const sound = record.sound ?? 'chime';
      const snoozeMinutes = record.snoozeMinutes ?? 5;
      const date = record.date;
      const enabled = record.enabled !== undefined ? record.enabled : true;

      if (typeof id !== 'string' || id.trim().length === 0) continue;
      if (!this.isValidTime(time)) continue;
      if (typeof label !== 'string' || label.trim().length === 0) continue;
      if (!Array.isArray(repeatDays) || !repeatDays.every((day): day is AlarmDay => this.isValidAlarmDay(day))) continue;
      if (typeof sound !== 'string') continue;
      if (typeof snoozeMinutes !== 'number' || !Number.isInteger(snoozeMinutes) || snoozeMinutes < 1 || snoozeMinutes > 60) continue;
      if (!this.isValidDate(date)) continue;

      valid.push({ id, time, label, repeat, repeatDays, sound, snoozeMinutes, date, enabled });
    }
    return valid;
  }

  private isAlarmShape(value: unknown): value is Partial<Alarm> {
    return typeof value === 'object' && value !== null;
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

      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const validAlarms = this.filterValidAlarms(parsed);
      this.alarms.set(validAlarms);

      validAlarms.forEach((alarm) => {
        if (alarm.enabled) {
          this.scheduleAlarm(alarm);
        }
      });
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
  state: 'running' | 'paused' | 'expired' | 'stopped';
}
