export interface Playlist {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export function createEmptyPlaylist(): Playlist {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: '',
    exerciseIds: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
