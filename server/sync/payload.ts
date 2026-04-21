import { z } from 'zod';

export const MAX_CLOCK_SKEW_MS = 60_000;
// Used by API route handlers (Task 7/8) to cap request body size.
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

const timestamp = z
  .number()
  .int()
  .positive()
  .refine((t) => t <= Date.now() + MAX_CLOCK_SKEW_MS, {
    message: 'updatedAt too far in the future',
  });

const nullableTimestamp = z
  .number()
  .int()
  .positive()
  .refine((t) => t <= Date.now() + MAX_CLOCK_SKEW_MS, {
    message: 'deletedAt too far in the future',
  })
  .nullable();

const EntityItemSchema = z.object({
  id: z.string().min(1).max(128),
  updatedAt: timestamp,
  deletedAt: nullableTimestamp,
  data: z.record(z.unknown()),
});

const SettingsPayload = z.object({
  updatedAt: timestamp,
  data: z.record(z.unknown()),
});

export const PushPayloadSchema = z.object({
  exercises: z.array(EntityItemSchema).max(5000),
  playlists: z.array(EntityItemSchema).max(5000),
  settings: SettingsPayload.nullable(),
});

export type PushPayload = z.infer<typeof PushPayloadSchema>;
export type EntityItem = z.infer<typeof EntityItemSchema>;

export const PullQuerySchema = z.object({
  since: z
    .string()
    .min(1)
    .optional()
    .transform((s) => (s === undefined ? undefined : Number(s)))
    .refine((n) => n === undefined || (Number.isInteger(n) && n >= 0), {
      message: 'since must be non-negative integer',
    }),
});

export type PullQuery = z.infer<typeof PullQuerySchema>;

export interface PullResponse {
  exercises: EntityItem[];
  playlists: EntityItem[];
  settings: { updatedAt: number; data: Record<string, unknown> } | null;
  serverTime: number;
}

export interface PushResponse {
  accepted: { exercises: string[]; playlists: string[]; settings: boolean };
  rejected: { exercises: string[]; playlists: string[]; settings: boolean };
  serverTime: number;
}
