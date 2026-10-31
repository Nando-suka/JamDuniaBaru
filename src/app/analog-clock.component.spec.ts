import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AnalogClockComponent } from './analog-clock.component';
import { AnalogClockService } from './analog-clock.service';
import { LanguageService } from './languange.service';

describe('AnalogClockComponent motion scheduling', () => {
  let fixture: ComponentFixture<AnalogClockComponent>;
  let clockService: AnalogClockService;
  let motionPreference: MediaQueryList;
  let originalMatchMedia: PropertyDescriptor | undefined;
  let originalRequestAnimationFrame: PropertyDescriptor | undefined;
  let originalCancelAnimationFrame: PropertyDescriptor | undefined;
  let requestFrameMock: ReturnType<typeof vi.fn>;
  let cancelFrameMock: ReturnType<typeof vi.fn>;
  let nextFrameId: number;
  let frameCallbacks: Map<number, FrameRequestCallback>;

  beforeEach(async () => {
    motionPreference = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    originalRequestAnimationFrame = Object.getOwnPropertyDescriptor(
      window,
      'requestAnimationFrame'
    );
    originalCancelAnimationFrame = Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => motionPreference),
    });
    nextFrameId = 123;
    frameCallbacks = new Map();
    requestFrameMock = vi.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId++;
      frameCallbacks.set(frameId, callback);
      return frameId;
    });
    cancelFrameMock = vi.fn();
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: requestFrameMock,
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: cancelFrameMock,
    });

    await TestBed.configureTestingModule({
      imports: [AnalogClockComponent],
    }).compileComponents();
    clockService = TestBed.inject(AnalogClockService);
    fixture = TestBed.createComponent(AnalogClockComponent);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
    if (originalRequestAnimationFrame) {
      Object.defineProperty(window, 'requestAnimationFrame', originalRequestAnimationFrame);
    } else {
      Reflect.deleteProperty(window, 'requestAnimationFrame');
    }
    if (originalCancelAnimationFrame) {
      Object.defineProperty(window, 'cancelAnimationFrame', originalCancelAnimationFrame);
    } else {
      Reflect.deleteProperty(window, 'cancelAnimationFrame');
    }
  });

  it('uses one-second updates without a frame loop when reduced motion is preferred', () => {
    motionPreference = { ...motionPreference, matches: true } as MediaQueryList;
    vi.useFakeTimers();
    const updateSpy = vi.spyOn(clockService, 'getClockHandAngles');
    const rafCallsBeforeInitialization = requestFrameMock.mock.calls.length;

    fixture.detectChanges();
    expect(requestFrameMock).toHaveBeenCalledTimes(rafCallsBeforeInitialization);

    vi.advanceTimersByTime(1000);
    expect(updateSpy).toHaveBeenCalledTimes(2);

    fixture.destroy();
    vi.advanceTimersByTime(1000);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });

  it('uses and cancels the animation frame loop for normal motion', () => {
    fixture.detectChanges();

    expect(requestFrameMock).toHaveBeenCalled();
    const pendingFrameId = nextFrameId - 1;
    const requestsBeforeFrame = requestFrameMock.mock.calls.length;
    frameCallbacks.get(pendingFrameId)?.(16);
    expect(requestFrameMock).toHaveBeenCalledTimes(requestsBeforeFrame + 1);
    const latestFrameId = nextFrameId - 1;

    fixture.destroy();
    expect(cancelFrameMock).toHaveBeenCalledWith(latestFrameId);
    expect(latestFrameId).not.toBe(pendingFrameId);
  });

  it('updates the active clock when time and timezone inputs change', () => {
    motionPreference = { ...motionPreference, matches: true } as MediaQueryList;
    vi.useFakeTimers();
    fixture.detectChanges();
    fixture.componentRef.setInput('time', new Date('2024-07-01T07:15:30Z'));
    fixture.componentRef.setInput('timezone', 'America/New_York');
    fixture.detectChanges();
    expect(fixture.componentInstance.time.toISOString()).toBe('2024-07-01T07:15:30.000Z');
    expect(fixture.componentInstance.timezone).toBe('America/New_York');
    vi.advanceTimersByTime(1000);

    expect(fixture.componentInstance.clockHandAngles).toEqual({
      hour: 97.5,
      minute: 93,
      second: 180,
    });
    expect(fixture.componentInstance.getTimeString()).toBe('03:15:30');
  });

  it('formats 12-hour time with localized day periods', () => {
    const languageService = TestBed.inject(LanguageService);
    const originalLanguage = languageService.currentLang();
    const originalFormat = clockService.clockConfig().use24Hour;
    fixture.componentInstance.timezone = 'UTC';
    clockService.setConfig({ use24Hour: false });

    try {
      languageService.currentLang.set('en');
      fixture.componentInstance.time = new Date('2024-07-01T03:15:30Z');
      expect(fixture.componentInstance.getTimeString()).toBe('03:15:30 AM');
      fixture.componentInstance.time = new Date('2024-07-01T15:15:30Z');
      expect(fixture.componentInstance.getTimeString()).toBe('03:15:30 PM');

      languageService.currentLang.set('id');
      fixture.componentInstance.time = new Date('2024-07-01T03:15:30Z');
      expect(fixture.componentInstance.getTimeString()).toBe('03.15.30 pagi');
      fixture.componentInstance.time = new Date('2024-07-01T15:15:30Z');
      expect(fixture.componentInstance.getTimeString()).toBe('03.15.30 sore');
    } finally {
      languageService.currentLang.set(originalLanguage);
      clockService.setConfig({ use24Hour: originalFormat });
    }
  });

  it('falls back to UTC and continues updating for an invalid timezone', () => {
    fixture.componentInstance.time = new Date('2024-07-01T03:15:30Z');
    fixture.componentInstance.timezone = 'Invalid/TimeZone';
    motionPreference = { ...motionPreference, matches: true } as MediaQueryList;
    vi.useFakeTimers();
    const updateSpy = vi.spyOn(clockService, 'getClockHandAngles');

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.clockHandAngles).toEqual({
      hour: 97.5,
      minute: 93,
      second: 180,
    });
    expect(fixture.componentInstance.getTimeString()).toBe('03:15:30');
    expect(fixture.componentInstance.getDisplayTimeZone()).toBe('UTC');

    vi.advanceTimersByTime(1000);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });
});
