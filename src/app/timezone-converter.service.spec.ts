import { TestBed } from '@angular/core/testing';
import { City } from './search.service';
import { TimezoneConverterService } from './timezone-converter.service';

describe('TimezoneConverterService', () => {
  let service: TimezoneConverterService;

  const newYork: City = {
    name: 'New York',
    offset: -5,
    lat: 40.7128,
    lon: -74.006,
    timeZone: 'America/New_York',
  };
  const phoenix: City = {
    name: 'Phoenix',
    offset: -7,
    lat: 33.4484,
    lon: -112.074,
    timeZone: 'America/Phoenix',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimezoneConverterService);
    service.reset();
  });

  it('uses daylight-saving offsets for current city offsets', () => {
    const summer = new Date('2024-07-01T16:00:00Z');
    const winter = new Date('2024-01-01T17:00:00Z');

    expect(service.getCityOffset(newYork, summer)).toBe(-4);
    expect(service.getCityOffset(newYork, winter)).toBe(-5);
    expect(service.getCityOffset(phoenix, summer)).toBe(-7);
  });

  it('converts a manual source time using the source and target IANA zones', () => {
    service.setFromCity(newYork);
    service.setToCity(phoenix);
    service.setInputDate('2024-07-01');
    service.setInputTime('12:00');

    const result = service.convertedResult();

    expect(result).toBeTruthy();
    expect(service.formatTime(result!.sourceTime, '24h', 'America/New_York')).toMatch(/12[.:]00/);
    expect(service.formatTime(result!.convertedTime, '24h', 'America/Phoenix')).toMatch(/09[.:]00/);
    expect(result!.offsetDifference).toBe(-3);
  });
});
