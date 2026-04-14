import Konva from 'konva';

export interface TableRendererOptions {
  width: number;
  height: number;
  showZoneMarkers?: boolean;
  strokeScale?: number;
}

export class TableRenderer {
  private group: Konva.Group;

  constructor(opts: TableRendererOptions) {
    const { width, height, showZoneMarkers = false, strokeScale = 1 } = opts;

    this.group = new Konva.Group();

    const edgeWidth = 3 * strokeScale;
    const centerWidth = 1.5 * strokeScale;

    const background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: '#0d62c6',
      stroke: 'rgba(255, 255, 255, 0.55)',
      strokeWidth: edgeWidth,
      cornerRadius: 4 * strokeScale,
    });
    this.group.add(background);

    const net = new Konva.Line({
      points: [0, height / 2, width, height / 2],
      stroke: 'rgba(255, 255, 255, 0.55)',
      strokeWidth: edgeWidth,
    });
    this.group.add(net);

    const centerLine = new Konva.Line({
      points: [width / 2, 0, width / 2, height],
      stroke: 'rgba(255, 255, 255, 0.25)',
      strokeWidth: centerWidth,
    });
    this.group.add(centerLine);

    if (showZoneMarkers) {
      this.addZoneLabel('VH', width * 0.25, height - 20);
      this.addZoneLabel('RH', width * 0.75, height - 20);
      this.addZoneLabel('RH', width * 0.25, 20);
      this.addZoneLabel('VH', width * 0.75, 20);
    }
  }

  private addZoneLabel(text: string, x: number, y: number) {
    const label = new Konva.Text({
      x: x - 12,
      y: y - 8,
      text,
      fontSize: 11,
      fontFamily: 'Inter',
      fill: 'rgba(255,255,255,0.3)',
    });
    this.group.add(label);
  }

  getKonvaNode(): Konva.Group {
    return this.group;
  }
}
