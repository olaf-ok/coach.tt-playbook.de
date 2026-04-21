import { z } from 'zod';

export const MAX_CLOCK_SKEW_MS = 60_000;
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

const timestamp = z
  .number()
  .int()
  .positive()
  .refine((t) => t <= Date.now() + MAX_CLOCK_SKEW_MS, {
    message: 'updatedAt too far in the future',
  });

const EntityItem = z.object({
  id: z.string().min(1).max(128),
  updatedAt: timestamp,
  deletedAt: z.number().int().positive().nullable(),
  data: z.record(z.unknown()),
});

const SettingsPayload = z.object({
  updatedAt: timestamp,
  data: z.record(z.unknown()),
});

export const PushPayloadSchema = z.object({
  exercises: z.array(EntityItem).max(5000),
  playlists: z.array(EntityItem).max(5000),
  settings: SettingsPayload.nullable(),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type EntityItemT = z.infer<typeof EntityItem>;

export const PullQuerySchema = z.object({
  since: z
    .string()
    .optional()
    .transform((s) => (s === undefined ? undefined : Number(s)))
    .refine((n) => n === undefined || (Number.isInteger(n) && n >= 0), {
      message: 'since must be non-negative integer',
    }),
});

export type PullQuery = z.infer<typeof PullQuerySchema>;

export interface PullResponse {
  exercises: EntityItemT[];
  playlists: EntityItemT[];
  settings: { updatedAt: number; data: Record<string, unknown> } | null;
  serverTime: number;
}

export interface PushResponse {
  accepted: { exercises: string[]; playlists: string[]; settings: boolean };
  rejected: { exercises: string[]; playlists: string[]; settings: boolean };
  serverTime: number;
}
