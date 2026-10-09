import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AnalogClockComponent } from './analog-clock.component';
import { AnalogClockService } from './analog-clock.service';

describe('AnalogClockComponent motion scheduling', () => {
  let fixture: ComponentFixture<AnalogClockComponent>;
  let clockService: AnalogClockService;
  let motionPreference: MediaQueryList;
  let originalMatchMedia: PropertyDescriptor | undefined;
  let originalRequestAnimationFrame: PropertyDescriptor | undefined;
  let originalCancelAnimationFrame: PropertyDescriptor | undefined;
  let requestFrameMock: ReturnType<typeof vi.fn>;
  let cancelFrameMock: ReturnType<typeof vi.fn>;

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
    originalRequestAnimationFrame = Object.getOwnPropertyDescriptor(window, 'requestAnimationFrame');
    originalCancelAnimationFrame = Object.getOwnPropertyDescriptor(window, 'cancelAnimationFrame');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => motionPreference),
    });
    requestFrameMock = vi.fn(() => 123);
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
  });

  it('uses and cancels the animation frame loop for normal motion', () => {
    fixture.detectChanges();

    expect(requestFrameMock).toHaveBeenCalled();
    fixture.destroy();
    expect(cancelFrameMock).toHaveBeenCalledWith(123);
  });
});
