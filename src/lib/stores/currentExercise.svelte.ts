import type { Exercise, Stroke, Point } from '../types/exercise';
import { createEmptyExercise } from '../types/exercise';
import { getStrokeColor } from '../constants/colors';

function createExerciseStore() {
  let exercise = $state<Exercise>(createEmptyExercise());

  function addStroke(startPoint: Point, endPoint: Point): Stroke {
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      number: exercise.strokes.length + 1,
      startPoint,
      endPoint,
      controlPoint: null,
      strokeType: null,
      description: null,
    };
    exercise.strokes.push(newStroke);
    return newStroke;
  }

  function deleteStroke(id: string): void {
    exercise.strokes = exercise.strokes
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, number: i + 1 }));
  }

  function updateStroke(id: string, patch: Partial<Stroke>): void {
    const i = exercise.strokes.findIndex((s) => s.id === id);
    if (i === -1) return;
    exercise.strokes[i] = { ...exercise.strokes[i], ...patch };
  }

  function setControlPoint(id: string, cp: Point | null): void {
    updateStroke(id, { controlPoint: cp });
  }

  function assignStrokeType(id: string, shortLabel: string | null): void {
    updateStroke(id, { strokeType: shortLabel });
  }

  function setDescription(id: string, text: string): void {
    updateStroke(id, { description: text.trim() === '' ? null : text });
  }

  function reset(): void {
    exercise = createEmptyExercise();
  }

  function load(ex: Exercise): void {
    exercise = ex;
  }

  return {
    get exercise() {
      return exercise;
    },
    get strokeColor() {
      return (num: number) => getStrokeColor(num);
    },
    addStroke,
    deleteStroke,
    updateStroke,
    setControlPoint,
    assignStrokeType,
    setDescription,
    reset,
    load,
  };
}

export const currentExercise = createExerciseStore();
