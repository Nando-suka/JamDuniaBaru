import { Injectable, inject } from '@angular/core';
import { AlarmDay } from './alarm-timer.service';
import { LanguageService } from './languange.service';

export interface AlarmNextOccurrence {
  type: 'today' | 'tomorrow' | 'weekday' | 'paused' | 'invalid';
  message: string;
  timeUntil?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlarmNextOccurrenceService {
  private langService = inject(LanguageService);

  calculateNextOccurrence(
    alarmTime: string,
    enabled: boolean,
    repeatMode: 'never' | 'daily' | 'custom',
    repeatDays: AlarmDay[] = [],
    date?: string
  ): AlarmNextOccurrence {
    if (!enabled) {
      return { type: 'paused', message: this.dict().alarmPaused };
    }

    const [hours, minutes] = alarmTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return { type: 'invalid', message: this.dict().invalidAlarmTime };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (repeatMode === 'never') {
      if (!date) {
        return { type: 'invalid', message: this.dict().noDateSet };
      }

      const alarmDate = new Date(date + 'T' + alarmTime);
      if (alarmDate < now) {
        return { type: 'invalid', message: this.dict().alarmPassed };
      }

      const dateOnly = new Date(date);
      if (dateOnly.toDateString() === today.toDateString()) {
        const timeUntil = this.getTimeUntilString(now, alarmDate);
        return {
          type: 'today',
          message: `${this.dict().nextAlarm}: ${this.dict().today} at ${alarmTime}`,
          timeUntil,
        };
      }

      return {
        type: 'tomorrow',
        message: `${this.dict().nextAlarm}: ${this.formatDateAdjective(dateOnly)} at ${alarmTime}`,
      };
    }

    if (repeatMode === 'daily') {
      const alarmDateToday = new Date(today);
      alarmDateToday.setHours(hours, minutes, 0, 0);

      if (alarmDateToday > now) {
        const timeUntil = this.getTimeUntilString(now, alarmDateToday);
        return {
          type: 'today',
          message: `${this.dict().nextAlarm}: ${this.dict().today} at ${alarmTime}`,
          timeUntil,
        };
      }

      const tomorrowAlarm = new Date(today);
      tomorrowAlarm.setDate(today.getDate() + 1);
      tomorrowAlarm.setHours(hours, minutes, 0, 0);

      return {
        type: 'tomorrow',
        message: `${this.dict().nextAlarm}: ${this.dict().tomorrow} at ${alarmTime}`,
      };
    }

    if (repeatMode === 'custom' && repeatDays.length > 0) {
      const nextDate = this.getNextAlarmDate(hours, minutes, repeatDays, now);
      if (!nextDate) {
        return { type: 'invalid', message: this.dict().noUpcomingAlarm };
      }

      const dayName = this.getDayName(nextDate);
      const isToday = nextDate.toDateString() === today.toDateString();

      if (isToday) {
        const timeUntil = this.getTimeUntilString(now, nextDate);
        return {
          type: 'today',
          message: `${this.dict().nextAlarm}: ${this.dict().today} at ${alarmTime}`,
          timeUntil,
        };
      }

      return {
        type: 'weekday',
        message: `${this.dict().nextAlarm}: ${dayName} at ${alarmTime}`,
      };
    }

    return { type: 'invalid', message: this.dict().noRepeatConfiguration };
  }

  private getTimeUntilString(now: Date, alarmDate: Date): string {
    const diffMs = alarmDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `${this.dict().alarmScheduledIn} ${hours}h ${minutes}m`;
    }
    return `${this.dict().alarmScheduledIn} ${minutes}m`;
  }

  private getNextAlarmDate(
    hours: number,
    minutes: number,
    repeatDays: AlarmDay[],
    now: Date
  ): Date | null {
    const dayMap: Record<AlarmDay, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    const repeatDayNums = repeatDays.map((d) => dayMap[d]).sort((a, b) => a - b);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDayOfWeek = new Date(today).getDay();

    let nextDate: Date | null = null;

    for (let offset = 0; offset <= 7; offset++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + offset);
      const checkDayOfWeek = checkDate.getDay();

      if (repeatDayNums.includes(checkDayOfWeek)) {
        const candidate = new Date(checkDate);
        candidate.setHours(hours, minutes, 0, 0);

        if (candidate > now) {
          nextDate = candidate;
          break;
        }
      }
    }

    return nextDate;
  }

  private getDayName(date: Date): string {
    return new Intl.DateTimeFormat(this.langService.currentLang() === 'id' ? 'id-ID' : 'en-US', { weekday: 'long' }).format(date);
  }

  private formatDateAdjective(date: Date): string {
    return new Intl.DateTimeFormat(this.langService.currentLang() === 'id' ? 'id-ID' : 'en-US', { weekday: 'long' }).format(date);
  }

  private dict() {
    return this.langService.text();
  }
}
