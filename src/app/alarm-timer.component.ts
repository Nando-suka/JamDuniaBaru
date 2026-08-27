import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlarmTimerService, AlarmDay } from './alarm-timer.service';

type AlarmRepeatMode = 'never' | 'daily' | 'custom';

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

  editingAlarmId = signal<string | null>(null);
  isEditing = computed(() => this.editingAlarmId() !== null);

  alarmTime = signal('07:00');
  alarmDate = signal(this.getTodayDate());
  alarmLabel = signal('Alarm Pagi');
  repeatMode = signal<AlarmRepeatMode>('daily');
  repeatDays = signal<AlarmDay[]>([]);
  alarmSound = signal('chime');
  snoozeMinutes = signal(5);

  hasSelectedDays = computed(() => this.repeatDays().length > 0);
  alarmTimeError = computed(() => (this.alarmTime() ? '' : 'Pilih waktu alarm.'));
  alarmLabelError = computed(() => {
    const label = this.alarmLabel().trim();
    if (!label) return 'Masukkan nama alarm.';
    if (label.length > 60) return 'Nama alarm maksimal 60 karakter.';
    return '';
  });
  alarmDateError = computed(() => {
    if (this.repeatMode() !== 'never') return '';
    if (!this.alarmDate()) return 'Pilih tanggal alarm.';
    return this.alarmDate() < this.getTodayDate() ? 'Tanggal tidak boleh sebelum hari ini.' : '';
  });
  snoozeError = computed(() =>
    Number.isInteger(this.snoozeMinutes()) &&
    this.snoozeMinutes() >= 1 &&
    this.snoozeMinutes() <= 60
      ? ''
      : 'Snooze harus antara 1 dan 60 menit.'
  );
  alarmFormInvalid = computed(
    () =>
      !!this.alarmTimeError() ||
      !!this.alarmLabelError() ||
      !!this.alarmDateError() ||
      !!this.snoozeError() ||
      (this.repeatMode() === 'custom' && !this.hasSelectedDays())
  );
  scheduleSummary = computed(() => {
    const label = this.alarmLabel().trim() || 'Alarm';
    const time = this.alarmTime() || '--:--';

    if (this.repeatMode() === 'never') {
      return `"${label}" pukul ${time}, ${this.formatDateSummary(this.alarmDate())}`;
    }

    if (this.repeatMode() === 'daily') {
      return `"${label}" pukul ${time}, setiap hari`;
    }

    if (!this.repeatDays().length) {
      return `"${label}" pukul ${time}, pilih hari pengulangan`;
    }

    return `"${label}" pukul ${time}, setiap ${this.formatDayList(this.repeatDays())}`;
  });

  timerHours = signal(0);
  timerMinutes = signal(5);
  timerSeconds = signal(0);
  timerLabel = signal('Timer');
  timerDuration = computed(
    () => this.timerHours() * 3600 + this.timerMinutes() * 60 + this.timerSeconds()
  );
  timerLabelError = computed(() => {
    const label = this.timerLabel().trim();
    if (!label) return 'Masukkan nama timer.';
    if (label.length > 60) return 'Nama timer maksimal 60 karakter.';
    return '';
  });
  timerDurationError = computed(() =>
    this.timerDuration() > 0 ? '' : 'Durasi timer harus lebih dari 0 detik.'
  );
  timerInputError = computed(() =>
    [this.timerHours(), this.timerMinutes(), this.timerSeconds()].some(
      (value) => !Number.isInteger(value) || value < 0
    ) ||
    this.timerHours() > 23 ||
    this.timerMinutes() > 59 ||
    this.timerSeconds() > 59
      ? 'Masukkan jam, menit, dan detik yang valid.'
      : ''
  );
  timerFormInvalid = computed(
    () => !!this.timerLabelError() || !!this.timerDurationError() || !!this.timerInputError()
  );

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
    this.editingAlarmId.set(null);
    this.resetAlarmForm();
    this.showAlarmModal.set(true);
  }

  editAlarm(id: string): void {
    const alarm = this.alarms().find((a) => a.id === id);
    if (!alarm) return;

    this.editingAlarmId.set(id);
    this.alarmTime.set(alarm.time);
    this.alarmDate.set(alarm.date ?? this.getTodayDate());
    this.alarmLabel.set(alarm.label);
    this.repeatDays.set(alarm.repeatDays ?? []);
    this.repeatMode.set(alarm.repeatDays?.length ? 'custom' : alarm.repeat ? 'daily' : 'never');
    this.alarmSound.set(alarm.sound ?? 'chime');
    this.snoozeMinutes.set(alarm.snoozeMinutes ?? 5);
    this.showAlarmModal.set(true);
  }

  closeAlarmModal(): void {
    this.showAlarmModal.set(false);
    this.editingAlarmId.set(null);
    this.resetAlarmForm();
  }

  addOrUpdateAlarm(): void {
    if (this.alarmFormInvalid()) return;

    const editingId = this.editingAlarmId();
    const repeat = this.repeatMode() === 'daily';
    const repeatDays = this.repeatMode() === 'custom' ? this.repeatDays() : [];
    if (editingId) {
      this.alarmTimerService.updateAlarm(
        editingId,
        this.alarmTime(),
        this.alarmLabel(),
        repeat,
        repeatDays,
        this.alarmSound(),
        this.snoozeMinutes(),
        this.repeatMode() === 'never' ? this.alarmDate() : undefined
      );
    } else {
      this.alarmTimerService.addAlarm(
        this.alarmTime(),
        this.alarmLabel(),
        repeat,
        repeatDays,
        this.alarmSound(),
        this.snoozeMinutes(),
        this.repeatMode() === 'never' ? this.alarmDate() : undefined
      );
    }
    this.closeAlarmModal();
  }

  onRepeatModeChange(mode: AlarmRepeatMode): void {
    this.repeatMode.set(mode);
    if (mode !== 'custom') {
      this.repeatDays.set([]);
    }
  }

  applyAlarmSuggestion(suggestion: 'in-5-minutes' | 'tomorrow-morning' | 'next-weekday'): void {
    const now = new Date();
    const target = new Date(now);

    if (suggestion === 'in-5-minutes') {
      target.setMinutes(target.getMinutes() + 5);
      if (target.getSeconds() > 0) target.setMinutes(target.getMinutes() + 1);
      this.alarmLabel.set('Pengingat singkat');
    } else if (suggestion === 'tomorrow-morning') {
      target.setDate(target.getDate() + 1);
      target.setHours(7, 0, 0, 0);
      this.alarmLabel.set('Pagi hari');
    } else {
      target.setDate(target.getDate() + 1);
      while (target.getDay() === 0 || target.getDay() === 6) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(9, 0, 0, 0);
      this.alarmLabel.set('Hari kerja');
    }

    this.alarmTime.set(
      `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`
    );
    this.alarmDate.set(this.formatDateInput(target));
    this.onRepeatModeChange('never');
  }

  onDayToggle(day: AlarmDay): void {
    this.repeatDays.update((days) =>
      days.includes(day) ? days.filter((item) => item !== day) : [...days, day]
    );
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
    this.alarmDate.set(this.getTodayDate());
    this.alarmLabel.set('Alarm Pagi');
    this.repeatMode.set('daily');
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
    if (this.timerFormInvalid()) return;

    this.alarmTimerService.startTimer(this.timerDuration(), this.timerLabel().trim());
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

  private formatDayList(days: AlarmDay[]): string {
    const labels = days.map((day) => this.dayLabels[day] || day);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} dan ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, dan ${labels[labels.length - 1]}`;
  }

  private getTodayDate(): string {
    return this.formatDateInput(new Date());
  }

  private formatDateInput(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatDateSummary(date: string): string {
    if (!date) return 'pilih tanggal';
    return `pada ${new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${date}T00:00:00`))}`;
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

  getDeviceTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Zona waktu perangkat';
  }
}
