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

    const timeParts = alarmTime.split(':');
    if (timeParts.length !== 2) {
      return { type: 'invalid', message: this.dict().invalidAlarmTime };
    }
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return { type: 'invalid', message: this.dict().invalidAlarmTime };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (repeatMode === 'never') {
      if (!date) {
        return { type: 'invalid', message: this.dict().noDateSet };
      }

      const alarmDate = new Date(date + 'T' + alarmTime);
      if (Number.isNaN(alarmDate.getTime()) || alarmDate < now) {
        return { type: 'invalid', message: this.dict().alarmPassed };
      }

      const [y, m, d] = date.split('-').map(Number);
      const dateOnly = new Date(y, m - 1, d);
      if (dateOnly.toDateString() === today.toDateString()) {
        const timeUntil = this.getTimeUntilString(now, alarmDate);
        return {
          type: 'today',
          message: `${this.dict().nextAlarm}: ${this.dict().today} ${this.dict().at} ${alarmTime}`,
          timeUntil,
        };
      }

      const diffMs = dateOnly.getTime() - today.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
        // Alarm is later today but not caught by today check;
        // fall through to weekday type below.
      } else if (diffDays >= 1 && diffMs < 48 * 60 * 60 * 1000) {
        // Alarm is more than a day but less than 2 days in the future → 'tomorrow'.
        return {
          type: 'tomorrow',
          message: `${this.dict().nextAlarm}: ${this.dict().tomorrow} ${this.dict().at} ${alarmTime}`,
        };
      }

      return {
        type: 'weekday',
        message: `${this.dict().nextAlarm}: ${this.formatDateAdjective(dateOnly)} ${this.dict().at} ${alarmTime}`,
      };
    }

    if (repeatMode === 'daily') {
      const alarmDateToday = new Date(today);
      alarmDateToday.setHours(hours, minutes, 0, 0);

      if (alarmDateToday > now) {
        const timeUntil = this.getTimeUntilString(now, alarmDateToday);
        return {
          type: 'today',
          message: `${this.dict().nextAlarm}: ${this.dict().today} ${this.dict().at} ${alarmTime}`,
          timeUntil,
        };
      }

      return {
        type: 'tomorrow',
        message: `${this.dict().nextAlarm}: ${this.dict().tomorrow} ${this.dict().at} ${alarmTime}`,
      };
    }

    if (repeatMode === 'custom' && repeatDays.length > 0) {
      const nextDate = this.getNextAlarmDate(hours, minutes, repeatDays, now);
      if (!nextDate) {
        return { type: 'invalid', message: this.dict().noUpcomingAlarm };
      }

      const dayName = this.formatDateAdjective(nextDate);
      const isToday = nextDate.toDateString() === today.toDateString();

      if (isToday) {
        const timeUntil = this.getTimeUntilString(now, nextDate);
        return {
          type: 'today',
          message: `${this.dict().nextAlarm}: ${this.dict().today} ${this.dict().at} ${alarmTime}`,
          timeUntil,
        };
      }

      return {
        type: 'weekday',
        message: `${this.dict().nextAlarm}: ${dayName} ${this.dict().at} ${alarmTime}`,
      };
    }

    return { type: 'invalid', message: this.dict().noRepeatConfiguration };
  }

  private getTimeUntilString(now: Date, alarmDate: Date): string {
    const diffMs = alarmDate.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `${this.dict().alarmScheduledIn} ${hours}${this.dict().hourShort} ${minutes}${this.dict().minuteShort}`;
    }
    if (diffMs < 60000 && diffMs >= 0) {
      const seconds = Math.round(diffMs / 1000);
      return `${this.dict().alarmScheduledIn} ${seconds}${this.dict().secondShort}`;
    }
    return `${this.dict().alarmScheduledIn} ${minutes}${this.dict().minuteShort}`;
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

  private formatWeekday(date: Date): string {
    return new Intl.DateTimeFormat(this.langService.currentLang() === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
    }).format(date);
  }

  private getDayName(date: Date): string {
    return this.formatDateAdjective(date);
  }

  private formatDateAdjective(date: Date): string {
    return this.formatWeekday(date);
  }

  private dict() {
    return this.langService.text();
  }
}
