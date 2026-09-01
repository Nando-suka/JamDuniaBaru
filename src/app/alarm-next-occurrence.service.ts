import { Injectable } from '@angular/core';
import { AlarmDay } from './alarm-timer.service';

export interface AlarmNextOccurrence {
  type: 'today' | 'tomorrow' | 'weekday' | 'paused' | 'invalid';
  message: string;
  timeUntil?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlarmNextOccurrenceService {
  calculateNextOccurrence(
    alarmTime: string,
    enabled: boolean,
    repeatMode: 'never' | 'daily' | 'custom',
    repeatDays: AlarmDay[] = [],
    date?: string
  ): AlarmNextOccurrence {
    if (!enabled) {
      return { type: 'paused', message: 'Alarm is paused' };
    }

    const [hours, minutes] = alarmTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return { type: 'invalid', message: 'Invalid alarm time' };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (repeatMode === 'never') {
      if (!date) {
        return { type: 'invalid', message: 'No date set' };
      }

      const alarmDate = new Date(date + 'T' + alarmTime);
      if (alarmDate < now) {
        return { type: 'invalid', message: 'Alarm time has passed' };
      }

      const dateOnly = new Date(date);
      if (dateOnly.toDateString() === today.toDateString()) {
        const timeUntil = this.getTimeUntilString(now, alarmDate);
        return {
          type: 'today',
          message: `Next alarm: Today at ${alarmTime}`,
          timeUntil,
        };
      }

      return {
        type: 'tomorrow',
        message: `Next alarm: ${this.formatDateAdjective(dateOnly)} at ${alarmTime}`,
      };
    }

    if (repeatMode === 'daily') {
      const alarmDateToday = new Date(today);
      alarmDateToday.setHours(hours, minutes, 0, 0);

      if (alarmDateToday > now) {
        const timeUntil = this.getTimeUntilString(now, alarmDateToday);
        return {
          type: 'today',
          message: `Next alarm: Today at ${alarmTime}`,
          timeUntil,
        };
      }

      const tomorrowAlarm = new Date(today);
      tomorrowAlarm.setDate(today.getDate() + 1);
      tomorrowAlarm.setHours(hours, minutes, 0, 0);

      return {
        type: 'tomorrow',
        message: `Next alarm: Tomorrow at ${alarmTime}`,
      };
    }

    if (repeatMode === 'custom' && repeatDays.length > 0) {
      const nextDate = this.getNextAlarmDate(hours, minutes, repeatDays, now);
      if (!nextDate) {
        return { type: 'invalid', message: 'No upcoming alarm' };
      }

      const dayName = this.getDayName(nextDate);
      const isToday = nextDate.toDateString() === today.toDateString();

      if (isToday) {
        const timeUntil = this.getTimeUntilString(now, nextDate);
        return {
          type: 'today',
          message: `Next alarm: Today at ${alarmTime}`,
          timeUntil,
        };
      }

      return {
        type: 'weekday',
        message: `Next alarm: ${dayName} at ${alarmTime}`,
      };
    }

    return { type: 'invalid', message: 'No repeat configuration' };
  }

  private getTimeUntilString(now: Date, alarmDate: Date): string {
    const diffMs = alarmDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `Alarm is scheduled in ${hours}h ${minutes}m`;
    }
    return `Alarm is scheduled in ${minutes}m`;
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
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private formatDateAdjective(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
}
