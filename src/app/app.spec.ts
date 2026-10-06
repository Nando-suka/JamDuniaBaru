import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { App } from './app';
import { AlarmTimerService } from './alarm-timer.service';
import { AlarmTimerComponent } from './alarm-timer.component';
import { ToastService } from './toast.service';

describe('App', () => {
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render search input with correct placeholder', async () => {
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('.search-input') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.placeholder).toContain('Cari');
  });

  it('should associate the city search input with a label', async () => {
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('#city-search-input') as HTMLInputElement;
    const label = compiled.querySelector('label[for="city-search-input"]');

    expect(input).toBeTruthy();
    expect(label?.textContent).toContain('Search cities');
  });

  it('should render local time and last-updated indicators', async () => {
    await fixture.whenStable();

    const status = fixture.nativeElement.querySelector('.clock-status') as HTMLElement;
    expect(status.textContent).toContain('Local time now:');
    expect(status.textContent).toContain('Last updated:');
    expect(status.hasAttribute('aria-live')).toBe(false);
    expect(status.hasAttribute('role')).toBe(false);
  });

  it('should give each favorite toggle a city-specific accessible name and pressed state', async () => {
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.favorite-btn') as HTMLButtonElement;
    const cityName = fixture.nativeElement.querySelector('.city-name')?.textContent?.trim();

    expect(button.getAttribute('aria-label')).toContain(cityName);
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toContain(`Remove ${cityName} from favorites`);
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    fixture.detectChanges();
  });

  it('should offer a show-all action when favorites are empty', async () => {
    const app = fixture.componentInstance;
    app.facade.showFavoritesOnly.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const emptyState = fixture.nativeElement.querySelector('.favorites-empty-state') as HTMLElement;
    const showAllButton = emptyState.querySelector('button') as HTMLButtonElement;
    expect(emptyState).toBeTruthy();
    expect(showAllButton.textContent).toContain('Show all cities');

    showAllButton.click();
    fixture.detectChanges();
    expect(app.facade.showFavoritesOnly()).toBe(false);
  });

  it('should announce the selected city in the map status region', async () => {
    const app = fixture.componentInstance;
    app.showMapView.set(true);
    app.selectCityOnMap('Jakarta');
    fixture.detectChanges();
    await fixture.whenStable();

    const status = fixture.nativeElement.querySelector('.map-selection-status') as HTMLElement;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('Selected city: Jakarta');

    const cityItems = Array.from(
      fixture.nativeElement.querySelectorAll('.map-city-list-item')
    ) as HTMLButtonElement[];
    expect(cityItems.length).toBe(app.mapLocations.length);
    const selectedCityItem = cityItems.find((item) => item.textContent?.includes('Jakarta'));
    expect(selectedCityItem?.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.map-pin.selected')?.getAttribute('aria-label')).toBe('Jakarta');

    app.zoomMapIn();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.world-map') as HTMLElement).style.transform).toBe('scale(1.25)');
    for (let step = 0; step < 10; step++) app.zoomMapIn();
    expect(app.mapZoom()).toBe(2.5);
    for (let step = 0; step < 20; step++) app.zoomMapOut();
    expect(app.mapZoom()).toBe(1);
  });

  it('should label the mobile tools trigger for assistive technology', async () => {
    const app = fixture.componentInstance as any;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 500,
    });
    app.onResize();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector('.tools-trigger') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-label')).toBe('Open tools menu');
  });

  it('should show an explicit status label for enabled alarms', async () => {
    const alarmService = TestBed.inject(AlarmTimerService);
    alarmService.addAlarm('07:00', 'Wake up', true, [], 'chime', 5);

    fixture.componentInstance.showAlarmTimer.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusText = Array.from(compiled.querySelectorAll('strong')).some((node) =>
      node.textContent?.includes('Enabled')
    );

    expect(statusText).toBe(true);
  });

  it('should show a paused status label when an alarm is disabled', async () => {
    const alarmService = TestBed.inject(AlarmTimerService);
    alarmService.addAlarm('07:00', 'Paused alarm', true, [], 'chime', 5);
    const alarm = alarmService.alarms()[0];
    alarmService.toggleAlarm(alarm.id);

    fixture.componentInstance.showAlarmTimer.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const statusText = Array.from(root.querySelectorAll('.status-value')).some((node) =>
      node.textContent?.includes('Paused')
    );

    expect(statusText).toBe(true);
  });

  it('should announce errors assertively and routine toast feedback politely', async () => {
    const toastService = TestBed.inject(ToastService);
    toastService.success('Alarm saved');
    toastService.error('Alarm could not be saved');
    fixture.componentInstance.showAlarmTimer.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const successToast = root.querySelector('.toast-success') as HTMLElement;
    const errorToast = root.querySelector('.toast-error') as HTMLElement;

    expect(successToast.getAttribute('role')).toBe('status');
    expect(successToast.getAttribute('aria-atomic')).toBe('true');
    expect(errorToast.getAttribute('role')).toBe('alert');
    expect(errorToast.getAttribute('aria-atomic')).toBe('true');
  });

  it('should defer notification guidance until scheduling and distinguish permission states', async () => {
    const alarmService = TestBed.inject(AlarmTimerService);
    const app = fixture.componentInstance;
    app.showAlarmTimer.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const alarmComponent = fixture.debugElement.query(By.directive(AlarmTimerComponent))
      .componentInstance as AlarmTimerComponent;

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.notification-banner')).toBeNull();

    vi.spyOn(alarmService, 'isNotificationSupported').mockReturnValue(true);
    alarmService.notificationPermission.set('default');
    alarmComponent.addOrUpdateAlarm();
    fixture.detectChanges();

    let banner = root.querySelector('.notification-banner') as HTMLElement;
    expect(banner.textContent).toContain('Allow notifications');
    expect(banner.querySelector('button')?.textContent).toContain('Allow Notifications');
    expect(banner.querySelector('a')).toBeNull();

    alarmService.notificationPermission.set('denied');
    expect(alarmComponent.notificationGuidanceState()).toBe('denied');

    const alarm = alarmService.alarms()[0];
    vi.spyOn(alarmService, 'isNotificationSupported').mockReturnValue(false);
    expect(alarmComponent.notificationGuidanceState()).toBe('unsupported');
    alarmService.removeAlarm(alarm.id);
  });

  it('should show notification guidance after starting a timer in a new session', async () => {
    const app = fixture.componentInstance;
    const alarmService = TestBed.inject(AlarmTimerService);
    app.showAlarmTimer.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const alarmComponent = fixture.debugElement.query(By.directive(AlarmTimerComponent))
      .componentInstance as AlarmTimerComponent;

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.notification-banner')).toBeNull();

    vi.spyOn(alarmService, 'isNotificationSupported').mockReturnValue(true);
    alarmService.notificationPermission.set('default');
    alarmComponent.startTimer();
    fixture.detectChanges();

    const banner = root.querySelector('.notification-banner') as HTMLElement;
    expect(banner.textContent).toContain('Allow notifications');

    const timer = alarmService.activeTimers()[0];
    if (timer) alarmService.stopTimer(timer.id);
  });
});
