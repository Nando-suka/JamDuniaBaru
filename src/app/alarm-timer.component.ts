import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlarmTimerService, Alarm, Timer } from './alarm-timer.service';

@Component({
  selector: 'app-alarm-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alarm-timer.component.html',
  styleUrl: './alarm-timer.component.css'
})
export class AlarmTimerComponent {
  private alarmTimerService = inject(AlarmTimerService);

  // Signals untuk UI state
  showAlarmModal = signal(false);
  showTimerModal = signal(false);
  activeTab = signal<'alarm' | 'timer'>('alarm');

  // Form data
  alarmTime = signal('07:00');
  alarmLabel = signal('Alarm Pagi');
  alarmRepeat = signal(true);

  timerHours = signal(0);
  timerMinutes = signal(5);
  timerSeconds = signal(0);
  timerLabel = signal('Timer');

  // Computed signals
  alarms = this.alarmTimerService.alarms;
  activeTimers = this.alarmTimerService.activeTimers;
  notificationPermission = this.alarmTimerService.notificationPermission;

  // Helper to get first active timer (for backward compatibility)
  get activeTimer() {
    return () => this.activeTimers().length > 0 ? this.activeTimers()[0] : null;
  }

  // ===== ALARM METHODS =====
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
      this.alarmRepeat()
    );
    this.closeAlarmModal();
  }

  removeAlarm(id: string): void {
    this.alarmTimerService.removeAlarm(id);
  }

  toggleAlarm(id: string): void {
    this.alarmTimerService.toggleAlarm(id);
  }

  private resetAlarmForm(): void {
    this.alarmTime.set('07:00');
    this.alarmLabel.set('Alarm Pagi');
    this.alarmRepeat.set(true);
  }

  // ===== TIMER METHODS =====
  openTimerModal(): void {
    this.showTimerModal.set(true);
  }

  closeTimerModal(): void {
    this.showTimerModal.set(false);
    this.resetTimerForm();
  }

  startTimer(): void {
    const totalSeconds = (this.timerHours() * 3600) + (this.timerMinutes() * 60) + this.timerSeconds();
    if (totalSeconds <= 0) return;

    this.alarmTimerService.startTimer(totalSeconds, this.timerLabel());
    this.closeTimerModal();
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
    const timer = this.activeTimers().length > 0 ? this.activeTimers()[0] : null;
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

  // ===== NOTIFICATION METHODS =====
  async requestNotificationPermission(): Promise<void> {
    await this.alarmTimerService.requestNotificationPermission();
  }

  // ===== UTILITY METHODS =====
  formatTimerDisplay(seconds: number): string {
    return this.alarmTimerService.formatTime(seconds);
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}