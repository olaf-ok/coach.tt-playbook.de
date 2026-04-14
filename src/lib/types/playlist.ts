export interface Playlist {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: number;
  updatedAt: number;
}

export function createEmptyPlaylist(): Playlist {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: '',
    exerciseIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
