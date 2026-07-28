import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlarmTimerService, AlarmDay } from './alarm-timer.service';

@Component({
  selector: 'app-alarm-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alarm-timer.component.html',
  styleUrl: './alarm-timer.component.css',
})
export class AlarmTimerComponent {
  private alarmTimerService = inject(AlarmTimerService);

  showAlarmModal = signal(false);
  showTimerModal = signal(false);
  activeTab = signal<'alarm' | 'timer'>('alarm');

  alarmTime = signal('07:00');
  alarmLabel = signal('Alarm Pagi');
  alarmRepeat = signal(true);
  repeatDays = signal<AlarmDay[]>([]);
  alarmSound = signal('chime');
  snoozeMinutes = signal(5);

  timerHours = signal(0);
  timerMinutes = signal(5);
  timerSeconds = signal(0);
  timerLabel = signal('Timer');

  timerPresets = [
    { label: '5 min', minutes: 5 },
    { label: '15 min', minutes: 15 },
    { label: '25 min', minutes: 25 },
    { label: '45 min', minutes: 45 },
    { label: '1 jam', minutes: 60 },
  ];

  weekDays = [
    { label: 'Min', value: 'sun' as AlarmDay },
    { label: 'Sen', value: 'mon' as AlarmDay },
    { label: 'Sel', value: 'tue' as AlarmDay },
    { label: 'Rab', value: 'wed' as AlarmDay },
    { label: 'Kam', value: 'thu' as AlarmDay },
    { label: 'Jum', value: 'fri' as AlarmDay },
    { label: 'Sab', value: 'sat' as AlarmDay },
  ];

  dayLabels: Record<AlarmDay, string> = {
    sun: 'Minggu',
    mon: 'Senin',
    tue: 'Selasa',
    wed: 'Rabu',
    thu: 'Kamis',
    fri: 'Jumat',
    sat: 'Sabtu',
  };

  alarms = this.alarmTimerService.alarms;
  activeTimers = this.alarmTimerService.activeTimers;
  notificationPermission = this.alarmTimerService.notificationPermission;

  get activeTimer() {
    return () => (this.activeTimers().length > 0 ? this.activeTimers()[0] : null);
  }

  openAlarmModal(): void {
    this.showAlarmModal.set(true);
  }

  closeAlarmModal(): void {
    this.showAlarmModal.set(false);
    this.resetAlarmForm();
  }

  addAlarm(): void {
    if (!this.alarmTime()) return;

    this.alarmTimerService.addAlarm(
      this.alarmTime(),
      this.alarmLabel(),
      this.alarmRepeat(),
      this.repeatDays(),
      this.alarmSound(),
      this.snoozeMinutes()
    );
    this.closeAlarmModal();
  }

  removeAlarm(id: string): void {
    this.alarmTimerService.removeAlarm(id);
  }

  toggleAlarm(id: string): void {
    this.alarmTimerService.toggleAlarm(id);
  }

  snoozeAlarm(id: string, minutes: number): void {
    this.alarmTimerService.snoozeAlarm(id, minutes);
  }

  toggleRepeatDay(day: AlarmDay): void {
    this.repeatDays.update((days) =>
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day]
    );
  }

  isDaySelected(day: AlarmDay): boolean {
    return this.repeatDays().includes(day);
  }

  formatRepeatDays(days: AlarmDay[] | undefined): string {
    if (!days?.length) {
      return 'Setiap hari';
    }

    return days.map((day) => this.dayLabels[day] || day).join(', ');
  }

  private resetAlarmForm(): void {
    this.alarmTime.set('07:00');
    this.alarmLabel.set('Alarm Pagi');
    this.alarmRepeat.set(true);
    this.repeatDays.set([]);
    this.alarmSound.set('chime');
    this.snoozeMinutes.set(5);
  }

  openTimerModal(): void {
    this.showTimerModal.set(true);
  }

  closeTimerModal(): void {
    this.showTimerModal.set(false);
    this.resetTimerForm();
  }

  startTimer(): void {
    const totalSeconds = this.timerHours() * 3600 + this.timerMinutes() * 60 + this.timerSeconds();
    if (totalSeconds <= 0) return;

    this.alarmTimerService.startTimer(totalSeconds, this.timerLabel());
    this.closeTimerModal();
  }

  applyTimerPreset(minutes: number): void {
    this.timerHours.set(Math.floor(minutes / 60));
    this.timerMinutes.set(minutes % 60);
    this.timerSeconds.set(0);
  }

  stopTimer(): void {
    const timer = this.activeTimers().length > 0 ? this.activeTimers()[0] : null;
    if (timer) {
      this.alarmTimerService.stopTimer(timer.id);
    }
  }

  pauseTimer(): void {
    const timer = this.activeTimers().length > 0 ? this.activeTimers()[0] : null;
    if (timer) {
      this.alarmTimerService.pauseTimer(timer.id);
    }
  }

  resumeTimer(): void {
    const timer = this.activeTimer();
    if (timer) {
      this.alarmTimerService.resumeTimer(timer.id);
    }
  }

  private resetTimerForm(): void {
    this.timerHours.set(0);
    this.timerMinutes.set(5);
    this.timerSeconds.set(0);
    this.timerLabel.set('Timer');
  }

  async requestNotificationPermission(): Promise<void> {
    await this.alarmTimerService.requestNotificationPermission();
  }

  formatTimerDisplay(seconds: number): string {
    return this.alarmTimerService.formatTime(seconds);
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
