import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalogClockService, ClockHandAngles } from './analog-clock.service';

@Component({
  selector: 'app-analog-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analog-clock.component.html',
  styleUrl: './analog-clock.component.css'
})
export class AnalogClockComponent implements OnInit, OnDestroy {
  @Input() time: Date = new Date();
  @Input() timezone: string = 'UTC';
  @Input() cityName: string = '';

  private analogClockService = inject(AnalogClockService);
  private animationFrameId: number | null = null;

  clockHandAngles: ClockHandAngles = { hour: 0, minute: 0, second: 0 };
  clockConfig = this.analogClockService.clockConfig;
  hourMarkers = this.analogClockService.getHourMarkers();
  romanNumerals = this.analogClockService.getRomanNumerals();

  ngOnInit(): void {
    this.updateClockHands();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Update clock hand positions
   */
  private updateClockHands(): void {
    this.clockHandAngles = this.analogClockService.getClockHandAngles(this.time);
  }

  /**
   * Start smooth animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.updateClockHands();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Get hour hand style
   */
  getHourHandStyle(): { transform: string } {
    return {
      transform: `rotate(${this.clockHandAngles.hour}deg)`
    };
  }

  /**
   * Get minute hand style
   */
  getMinuteHandStyle(): { transform: string } {
    return {
      transform: `rotate(${this.clockHandAngles.minute}deg)`
    };
  }

  /**
   * Get second hand style
   */
  getSecondHandStyle(): { transform: string } {
    return {
      transform: `rotate(${this.clockHandAngles.second}deg)`
    };
  }

  /**
   * Get style for hour marker
   */
  getMarkerStyle(index: number): { transform: string } {
    const angle = index * 30;
    return {
      transform: `rotate(${angle}deg)`
    };
  }

  /**
   * Get rotated text style for hour labels
   */
  getLabelStyle(index: number): { transform: string } {
    const angle = index * 30;
    return {
      transform: `rotate(${angle}deg) translateY(-70px) rotate(-${angle}deg)`
    };
  }

  /**
   * Get time format string
   */
  getTimeString(): string {
    return this.analogClockService.formatTimeForClock(
      this.time,
      this.clockConfig().use24Hour
    );
  }

  /**
   * Get size class
   */
  getSizeClass(): string {
    return this.analogClockService.getSizeClass();
  }

  /**
   * Get design class
   */
  getDesignClass(): string {
    return this.analogClockService.getDesignClass();
  }

  /**
   * Toggle size
   */
  toggleSize(): void {
    this.analogClockService.toggleSize();
  }

  /**
   * Toggle design
   */
  toggleDesign(): void {
    this.analogClockService.toggleDesign();
  }

  /**
   * Toggle seconds
   */
  toggleSeconds(): void {
    this.analogClockService.toggleSeconds();
  }

  /**
   * Toggle labels
   */
  toggleLabels(): void {
    this.analogClockService.toggleLabels();
  }
}
