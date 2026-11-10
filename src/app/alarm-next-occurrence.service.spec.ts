import { TestBed } from '@angular/core/testing';
import { AlarmNextOccurrenceService } from './alarm-next-occurrence.service';
import { LanguageService } from './languange.service';

describe('AlarmNextOccurrenceService', () => {
  let service: AlarmNextOccurrenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AlarmNextOccurrenceService, LanguageService]
    });
    service = TestBed.inject(AlarmNextOccurrenceService);
  });

  it('should display countdown for alarms under 1 minute (rounding up)', () => {
    const now = new Date('2024-12-11T10:00:00');
    const alarmFuture = new Date('2024-12-11T10:00:30');
    const result = service['getTimeUntilString'](now, alarmFuture);
    expect(result).toBe('Alarm is scheduled in 30s');
  });

  it('should handle alarms exactly 1 minute away', () => {
    const now = new Date('2024-12-11T10:00:00');
    const alarmFuture = new Date('2024-12-11T10:01:00');
    const result = service['getTimeUntilString'](now, alarmFuture);
    expect(result).toBe('Alarm is scheduled in 1m');
  });

  it('should handle alarms just over 1 minute (rounding up)', () => {
    const now = new Date('2024-12-11T10:00:00');
    const alarmFuture = new Date('2024-12-11T10:01:01');
    const result = service['getTimeUntilString'](now, alarmFuture);
    expect(result).toBe('Alarm is scheduled in 2m');
  });

  it('should handle alarms over 1 hour', () => {
    const now = new Date('2024-12-11T10:00:00');
    const alarmFuture = new Date('2024-12-11T12:30:00');
    const result = service['getTimeUntilString'](now, alarmFuture);
    expect(result).toBe('Alarm is scheduled in 2h 30m');
  });

  it('should return 0 seconds when alarm time is now', () => {
    const now = new Date('2024-12-11T10:00:00');
    const alarmNow = new Date('2024-12-11T10:00:00');
    const result = service['getTimeUntilString'](now, alarmNow);
    expect(result).toBe('Alarm is scheduled in 0s');
  });

  it('should return "today" type when alarm is today with valid time', () => {
    const alarmTime = '14:30';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-11';

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('today');
    expect(result.message).toContain('Today at 14:30');
  });

  it('should return "invalid" when alarm time is invalid (wrong format)', () => {
    const alarmTime = '25:70';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-11';

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('invalid');
    expect(result.message).toBe('Invalid alarm time');
  });

  it('should return "invalid" when alarm time is invalid (wrong hour)', () => {
    const alarmTime = '25:30';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-11';

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('invalid');
    expect(result.message).toBe('Invalid alarm time');
  });

  it('should return "invalid" when alarm time is invalid (wrong minute)', () => {
    const alarmTime = '14:61';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-11';

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('invalid');
    expect(result.message).toBe('Invalid alarm time');
  });

  it('should return "invalid" when no date is set for never repeat mode', () => {
    const alarmTime = '14:30';
    const enabled = true;
    const repeatMode = 'never';

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], undefined);
    expect(result.type).toBe('invalid');
    expect(result.message).toBe('No date set');
  });

  it('should return "invalid" when alarm time has passed', () => {
    const alarmTime = '14:30';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-10'; // Yesterday

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('invalid');
    expect(result.message).toBe('Alarm time has passed');
  });

  it('should return "tomorrow" when alarm is tomorrow (less than 48h)', () => {
    const alarmTime = '14:30';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-12'; // Tomorrow

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('tomorrow');
    expect(result.message).toContain('Tomorrow at 14:30');
  });

  it('should return "weekday" when alarm is beyond tomorrow (more than 48h)', () => {
    const alarmTime = '14:30';
    const enabled = true;
    const repeatMode = 'never';
    const date = '2024-12-13'; // 2 days from now

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('weekday');
    expect(result.message).toContain('Wednesday at 14:30');
  });

  it('should return "paused" when alarm is disabled', () => {
    const alarmTime = '14:30';
    const enabled = false;
    const repeatMode = 'never';
    const date = '2024-12-11';

    const result = service.calculateNextOccurrence(alarmTime, enabled, repeatMode, [], date);
    expect(result.type).toBe('paused');
    expect(result.message).toBe('Alarm is paused');
  });
});