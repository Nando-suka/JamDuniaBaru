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
});
