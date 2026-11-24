import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlarmTimerService } from './alarm-timer.service';

describe('AlarmTimerService', () => {
  let service: AlarmTimerService;

  beforeEach(() => {
    const storage = new Map<string, string>();
    const fakeLocalStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
    };

    const fakeWindow = {
      localStorage: fakeLocalStorage,
      Notification: {
        permission: 'granted',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      setInterval: globalThis.setInterval,
      clearInterval: globalThis.clearInterval,
      AudioContext: undefined,
    };

    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('localStorage', fakeLocalStorage);
    vi.stubGlobal('Notification', fakeWindow.Notification);

    service = new AlarmTimerService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores custom alarm preferences including repeat days, sound, and snooze', () => {
    service.addAlarm('07:30', 'Wake up', true, ['mon', 'wed'], 'chime', 10);

    const alarms = service.alarms();
    expect(alarms).toHaveLength(1);
    expect(alarms[0]).toMatchObject({
      time: '07:30',
      label: 'Wake up',
      repeat: true,
      repeatDays: ['mon', 'wed'],
      sound: 'chime',
      snoozeMinutes: 10,
    });
  });

  it('transitions timer through running, expired terminal state, and deterministic cleanup', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
      // keep window timers aligned with fake timers
      (window as any).setInterval = globalThis.setInterval.bind(globalThis);
      (window as any).clearInterval = globalThis.clearInterval.bind(globalThis);
      (window as any).setTimeout = globalThis.setTimeout.bind(globalThis);
      (window as any).clearTimeout = globalThis.clearTimeout.bind(globalThis);
      // avoid Notification constructor/audio in test env; state transition is under test
      (window as any).Notification = { permission: 'denied' };
      vi.spyOn(service as any, 'sendNotification').mockImplementation(() => {});
      vi.spyOn(service as any, 'playAlarmSound').mockImplementation(() => {});

      service.startTimer(2, 'Tea');

      expect(service.timers()).toHaveLength(1);
      expect(service.timers()[0]).toMatchObject({
        label: 'Tea',
        remaining: 2,
        isRunning: true,
        state: 'running',
      });

      vi.advanceTimersByTime(1000);
      expect(service.timers()[0]).toMatchObject({ remaining: 1, isRunning: true, state: 'running' });

      vi.advanceTimersByTime(1000);
      expect(service.timers()).toHaveLength(1);
      expect(service.timers()[0]).toMatchObject({
        remaining: 0,
        isRunning: false,
        state: 'expired',
      });

      // Expired timer is terminal and removed on next tick; no stale active timer remains.
      vi.runOnlyPendingTimers();
      expect(service.timers()).toHaveLength(0);
      expect(service.activeTimers()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects invalid timer durations', () => {
    service.startTimer(0);
    service.startTimer(-5);
    service.startTimer(1.5);
    service.startTimer(Number.NaN);
    service.startTimer(Number.POSITIVE_INFINITY);

    expect(service.timers()).toHaveLength(0);
  });
});
