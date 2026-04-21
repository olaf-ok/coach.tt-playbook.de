export type EntityType = 'exercise' | 'playlist' | 'settings';

export interface QueueItem {
  id: string;
  type: EntityType;
  entityId: string;
  enqueuedAt: number;
}
