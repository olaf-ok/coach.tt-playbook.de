import type { Point, Stroke } from '../types/exercise';
import { currentExercise } from '../stores/currentExercise.svelte';
import { MAX_UNIQUE_COLORS } from '../constants/colors';

export class StrokeInputController {
  private pendingTapStart: Point | null = null;
  private dragStart: Point | null = null;
  private onOverflowWarning: (strokeNumber: number) => void;
  private hasWarnedOverflow = false;

  constructor(onOverflowWarning: (n: number) => void) {
    this.onOverflowWarning = onOverflowWarning;
  }

  handleTap(relPoint: Point): Stroke | null {
    if (this.pendingTapStart === null) {
      this.pendingTapStart = relPoint;
      return null;
    }
    const stroke = this.finishStroke(this.pendingTapStart, relPoint);
    this.pendingTapStart = null;
    return stroke;
  }

  handleDragStart(relPoint: Point): void {
    this.dragStart = relPoint;
    this.pendingTapStart = null;
  }

  handleDragMove(_relPoint: Point): void {
    // Preview optional — für Phase A: ohne Preview reicht
  }

  handleDragEnd(relPoint: Point): Stroke | null {
    if (this.dragStart === null) return null;
    const distance = Math.hypot(
      relPoint.x - this.dragStart.x,
      relPoint.y - this.dragStart.y
    );
    const start = this.dragStart;
    this.dragStart = null;
    if (distance < 0.03) return null;
    return this.finishStroke(start, relPoint);
  }

  resetPendingTap(): void {
    this.pendingTapStart = null;
  }

  private finishStroke(start: Point, end: Point): Stroke {
    const nextNumber = currentExercise.exercise.strokes.length + 1;
    const stroke = currentExercise.addStroke(start, end);
    if (nextNumber === MAX_UNIQUE_COLORS + 1 && !this.hasWarnedOverflow) {
      this.hasWarnedOverflow = true;
      this.onOverflowWarning(nextNumber);
    }
    return stroke;
  }
}
