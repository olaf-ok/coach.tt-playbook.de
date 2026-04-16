import { db } from './database';
import type { Exercise } from '../types/exercise';

const SEED_FLAG_KEY = 'tt-playbook-seeded';

const samples: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'VH-Topspin diagonal',
    tags: [],
    strokes: [
      {
        id: 's-vhts-1',
        number: 1,
        startPoint: { x: 0.25, y: 0.8 },
        endPoint: { x: 0.75, y: 0.2 },
        controlPoint: null,
        strokeType: 'FH_TOPSPIN',
        description: null,
      },
      {
        id: 's-vhts-2',
        number: 2,
        startPoint: { x: 0.75, y: 0.2 },
        endPoint: { x: 0.25, y: 0.8 },
        controlPoint: null,
        strokeType: 'FH_TOPSPIN',
        description: null,
      },
    ],
    repetitions: 10,
    duration: 'ca. 5 min',
  },
  {
    name: 'Aufschlag kurz + langer Retour',
    tags: [],
    strokes: [
      {
        id: 's-as-1',
        number: 1,
        startPoint: { x: 0.7, y: 0.9 },
        endPoint: { x: 0.4, y: 0.55 },
        controlPoint: null,
        strokeType: 'SERVE',
        description: null,
      },
      {
        id: 's-rs-1',
        number: 2,
        startPoint: { x: 0.4, y: 0.55 },
        endPoint: { x: 0.5, y: 0.05 },
        controlPoint: null,
        strokeType: 'RECEIVE',
        description: null,
      },
    ],
    repetitions: 8,
    duration: 'ca. 4 min',
  },
  {
    name: 'Block-Konter Wechsel',
    tags: [],
    strokes: [
      {
        id: 's-vhts-3',
        number: 1,
        startPoint: { x: 0.3, y: 0.8 },
        endPoint: { x: 0.5, y: 0.25 },
        controlPoint: null,
        strokeType: 'FH_TOPSPIN',
        description: null,
      },
      {
        id: 's-vhbl-1',
        number: 2,
        startPoint: { x: 0.5, y: 0.25 },
        endPoint: { x: 0.35, y: 0.7 },
        controlPoint: null,
        strokeType: 'FH_BLOCK',
        description: null,
      },
      {
        id: 's-vhts-4',
        number: 3,
        startPoint: { x: 0.35, y: 0.7 },
        endPoint: { x: 0.65, y: 0.2 },
        controlPoint: null,
        strokeType: 'FH_TOPSPIN',
        description: null,
      },
    ],
    repetitions: 6,
    duration: 'ca. 6 min',
  },
];

export async function seedIfEmpty(): Promise<boolean> {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(SEED_FLAG_KEY) === '1') {
    return false;
  }
  const count = await db.exercises.count();
  if (count > 0) {
    localStorage?.setItem(SEED_FLAG_KEY, '1');
    return false;
  }
  const now = Date.now();
  const exercises: Exercise[] = samples.map((s, i) => ({
    ...s,
    id: crypto.randomUUID(),
    createdAt: now - (samples.length - i) * 1000,
    updatedAt: now - (samples.length - i) * 1000,
  }));
  await db.exercises.bulkPut(exercises);
  localStorage?.setItem(SEED_FLAG_KEY, '1');
  return true;
}
