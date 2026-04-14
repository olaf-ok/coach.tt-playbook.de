export function addExerciseId(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids;
  return [...ids, id];
}

export function removeExerciseId(ids: string[], id: string): string[] {
  return ids.filter((x) => x !== id);
}

export function moveExerciseId(ids: string[], from: number, to: number): string[] {
  if (from === to) return ids;
  if (from < 0 || from >= ids.length) return ids;
  if (to < 0 || to >= ids.length) return ids;
  const next = ids.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
