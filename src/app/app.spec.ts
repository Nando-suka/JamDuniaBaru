import { TestBed } from '@angular/core/testing';
import { App } from './app';

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
});
