import { Injectable, signal, computed } from '@angular/core';

export interface AnalogClockConfig {
  showLabels: boolean;
  showSeconds: boolean;
  size: 'small' | 'medium' | 'large';
  design: 'traditional' | 'modern' | 'minimal';
  use24Hour: boolean;
}

export interface ClockHandAngles {
  hour: number;
  minute: number;
  second: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalogClockService {
  // Configuration signals
  clockConfig = signal<AnalogClockConfig>({
    showLabels: true,
    showSeconds: true,
    size: 'medium',
    design: 'modern',
    use24Hour: true
  });

  /**
   * Calculate clock hand angles based on time
   * @param date Date to calculate from
   * @returns Object with hour, minute, second angles in degrees
   */
  getClockHandAngles(date: Date): ClockHandAngles {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();

    // Calculate smooth second hand angle (30 degrees per second + milliseconds)
    const secondAngle = (seconds + milliseconds / 1000) * 6; // 360 / 60 = 6 degrees per second

    // Calculate minute hand angle (6 degrees per minute + seconds adjustment)
    const minuteAngle = (minutes + seconds / 60) * 6; // 360 / 60 = 6 degrees per minute

    // Calculate hour hand angle (30 degrees per hour + minutes adjustment)
    const hours12 = hours % 12;
    const hourAngle = (hours12 + minutes / 60) * 30; // 360 / 12 = 30 degrees per hour

    return {
      hour: hourAngle,
      minute: minuteAngle,
      second: secondAngle
    };
  }

  /**
   * Get size class for clock styling
   */
  getSizeClass(): string {
    const size = this.clockConfig().size;
    switch (size) {
      case 'small':
        return 'clock-small';
      case 'large':
        return 'clock-large';
      case 'medium':
      default:
        return 'clock-medium';
    }
  }

  /**
   * Get design class for clock styling
   */
  getDesignClass(): string {
    const design = this.clockConfig().design;
    switch (design) {
      case 'traditional':
        return 'clock-traditional';
      case 'minimal':
        return 'clock-minimal';
      case 'modern':
      default:
        return 'clock-modern';
    }
  }

  /**
   * Toggle clock size
   */
  toggleSize(): void {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const current = this.clockConfig().size;
    const nextIndex = (sizes.indexOf(current) + 1) % sizes.length;
    this.clockConfig.update(config => ({
      ...config,
      size: sizes[nextIndex]
    }));
  }

  /**
   * Toggle clock design
   */
  toggleDesign(): void {
    const designs: Array<'traditional' | 'modern' | 'minimal'> = ['traditional', 'modern', 'minimal'];
    const current = this.clockConfig().design;
    const nextIndex = (designs.indexOf(current) + 1) % designs.length;
    this.clockConfig.update(config => ({
      ...config,
      design: designs[nextIndex]
    }));
  }

  /**
   * Set specific configuration
   */
  setConfig(config: Partial<AnalogClockConfig>): void {
    this.clockConfig.update(current => ({
      ...current,
      ...config
    }));
  }

  /**
   * Toggle seconds visibility
   */
  toggleSeconds(): void {
    this.clockConfig.update(config => ({
      ...config,
      showSeconds: !config.showSeconds
    }));
  }

  /**
   * Toggle labels visibility
   */
  toggleLabels(): void {
    this.clockConfig.update(config => ({
      ...config,
      showLabels: !config.showLabels
    }));
  }

  /**
   * Format time for display in analog clock
   */
  formatTimeForClock(date: Date, use24Hour: boolean): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (use24Hour) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      const hours12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    }
  }

  /**
   * Get Roman numerals for clock (traditional design)
   */
  getRomanNumerals(): string[] {
    return ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  }

  /**
   * Get array of hour markers (1-12)
   */
  getHourMarkers(): number[] {
    return Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  }
}
