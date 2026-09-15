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
});
