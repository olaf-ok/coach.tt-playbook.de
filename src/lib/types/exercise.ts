import type { StrokeTypeCode } from '../constants/strokeTypes';

export interface Point {
  x: number; // 0.0–1.0 relativ zum Tisch
  y: number; // 0.0–1.0 relativ zum Tisch
}

export interface Stroke {
  id: string;
  number: number;
  startPoint: Point;
  endPoint: Point;
  controlPoint: Point | null;
  strokeType: StrokeTypeCode | null;
  description: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  tags: string[];
  strokes: Stroke[];
  repetitions: number | null;
  duration: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export function createEmptyExercise(): Exercise {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: '',
    tags: [],
    strokes: [],
    repetitions: null,
    duration: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
