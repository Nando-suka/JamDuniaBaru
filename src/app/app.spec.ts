import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AlarmTimerService } from './alarm-timer.service';

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
});
