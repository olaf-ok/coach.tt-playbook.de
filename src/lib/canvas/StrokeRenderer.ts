import Konva from 'konva';
import type { Stroke, Point } from '../types/exercise';
import { getStrokeColor, isRepeatedColor } from '../constants/colors';
import { relativeToPixel, type TableBox } from './coords';

export interface StrokeRenderEvents {
  onStrokeTap?: (strokeId: string) => void;
  onControlPointDrag?: (strokeId: string, newControlPoint: Point) => void;
}

export class StrokeRenderer {
  private group: Konva.Group;
  private arrow!: Konva.Arrow;
  private label!: Konva.Text;
  private controlHandle: Konva.Circle | null = null;
  private stroke: Stroke;
  private box: TableBox;
  private events: StrokeRenderEvents;

  constructor(stroke: Stroke, box: TableBox, events: StrokeRenderEvents = {}) {
    this.stroke = stroke;
    this.box = box;
    this.events = events;

    this.group = new Konva.Group();
    this.render();
  }

  private render() {
    const start = relativeToPixel(this.stroke.startPoint, this.box);
    const end = relativeToPixel(this.stroke.endPoint, this.box);
    const color = getStrokeColor(this.stroke.number);

    if (this.stroke.controlPoint) {
      const cp = relativeToPixel(this.stroke.controlPoint, this.box);
      this.arrow = new Konva.Arrow({
        points: [start.x, start.y, cp.x, cp.y, end.x, end.y],
        stroke: color,
        fill: color,
        strokeWidth: 3,
        pointerLength: 10,
        pointerWidth: 10,
        tension: 0.5,
      });
    } else {
      this.arrow = new Konva.Arrow({
        points: [start.x, start.y, end.x, end.y],
        stroke: color,
        fill: color,
        strokeWidth: 3,
        pointerLength: 10,
        pointerWidth: 10,
      });
    }

    this.arrow.on('tap click', (e) => {
      e.cancelBubble = true;
      this.events.onStrokeTap?.(this.stroke.id);
    });

    this.group.add(this.arrow);

    const mid = this.getMidpoint(start, end);
    const labelText = isRepeatedColor(this.stroke.number)
      ? `${this.stroke.number}·`
      : `${this.stroke.number}`;

    this.label = new Konva.Text({
      x: mid.x + 6,
      y: mid.y - 8,
      text: labelText,
      fontSize: 12,
      fontFamily: 'Inter',
      fill: color,
      fontStyle: '600',
      listening: false,
    });
    this.group.add(this.label);
  }

  private getMidpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  getKonvaNode(): Konva.Group {
    return this.group;
  }

  getStrokeId(): string {
    return this.stroke.id;
  }

  showControlHandle() {
    const start = relativeToPixel(this.stroke.startPoint, this.box);
    const end = relativeToPixel(this.stroke.endPoint, this.box);
    const initialCp = this.stroke.controlPoint
      ? relativeToPixel(this.stroke.controlPoint, this.box)
      : { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

    this.controlHandle = new Konva.Circle({
      x: initialCp.x,
      y: initialCp.y,
      radius: 8,
      fill: '#ffffff',
      stroke: getStrokeColor(this.stroke.number),
      strokeWidth: 2,
      draggable: true,
    });
    this.controlHandle.on('dragmove', () => {
      const pos = this.controlHandle!.position();
      this.events.onControlPointDrag?.(this.stroke.id, {
        x: (pos.x - this.box.x) / this.box.width,
        y: (pos.y - this.box.y) / this.box.height,
      });
    });
    this.group.add(this.controlHandle);
  }

  hideControlHandle() {
    this.controlHandle?.destroy();
    this.controlHandle = null;
  }
}
