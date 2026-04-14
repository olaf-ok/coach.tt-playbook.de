import { describe, it, expect } from 'vitest';
import { addExerciseId, removeExerciseId, moveExerciseId } from './playlistOps';

describe('addExerciseId', () => {
  it('fügt am Ende an', () => {
    expect(addExerciseId(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });
  it('fügt nicht doppelt ein', () => {
    expect(addExerciseId(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });
});

describe('removeExerciseId', () => {
  it('entfernt vorhandenes Element', () => {
    expect(removeExerciseId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
  it('lässt Liste unverändert, wenn id fehlt', () => {
    expect(removeExerciseId(['a', 'b'], 'x')).toEqual(['a', 'b']);
  });
});

describe('moveExerciseId', () => {
  it('verschiebt Element von fromIndex an toIndex', () => {
    expect(moveExerciseId(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('verschiebt rückwärts', () => {
    expect(moveExerciseId(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('no-op wenn from = to', () => {
    expect(moveExerciseId(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
  });
  it('no-op bei ungültigen Indizes', () => {
    expect(moveExerciseId(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
    expect(moveExerciseId(['a', 'b'], 0, 99)).toEqual(['a', 'b']);
  });
});
