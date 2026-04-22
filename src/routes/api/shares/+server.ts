import { json, error } from '@sveltejs/kit';
import { getDatabase } from '../../../../server/auth/db';
import { checkAndConsume } from '../../../../server/auth/ratelimit';
import {
  createShare,
  listUserShares,
  countActiveShares,
  exerciseExistsInSync,
} from '../../../../server/shares/shares';
import type { RequestHandler } from '@sveltejs/kit';

const FREE_SHARE_LIMIT = 5;
const FREE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
const PRO_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 280;

export const POST: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) throw error(401);

  let body: { exerciseId?: unknown; message?: unknown; neverExpires?: unknown };
  try {
    body = await event.request.json();
  } catch {
    throw error(400, 'invalid json');
  }

  const exerciseId = typeof body.exerciseId === 'string' ? body.exerciseId.trim() : null;
  if (!exerciseId) throw error(400, 'exerciseId required');

  const messageRaw = typeof body.message === 'string' ? body.message.trim() : null;
  const message = messageRaw && messageRaw.length > 0 ? messageRaw.slice(0, MAX_MESSAGE_LENGTH) : null;

  const neverExpires = body.neverExpires === true;

  const isPro = !!user.proUntil && user.proUntil > Date.now();
  const db = getDatabase();

  // Rate limiting
  const hAction = isPro ? 'shareCreateProH' : 'shareCreateFreeH';
  const dAction = isPro ? 'shareCreateProD' : 'shareCreateFreeD';
  if (!checkAndConsume(db, hAction, `user:${user.id}`) || !checkAndConsume(db, dAction, `user:${user.id}`)) {
    return json({ error: 'rate_limited' }, { status: 429 });
  }

  // Free limit check
  if (!isPro) {
    const count = countActiveShares(db, user.id);
    if (count >= FREE_SHARE_LIMIT) {
      return json({ error: 'share_limit' }, { status: 403 });
    }
  }

  // Exercise must be synced to server
  if (!exerciseExistsInSync(db, user.id, exerciseId)) {
    return json({ error: 'exercise_not_synced' }, { status: 404 });
  }

  // Determine expiry
  let expiresAt: number | null;
  if (isPro && neverExpires) {
    expiresAt = null;
  } else if (isPro) {
    expiresAt = Date.now() + PRO_EXPIRY_MS;
  } else {
    expiresAt = Date.now() + FREE_EXPIRY_MS;
  }

  const slug = createShare(db, { ownerId: user.id, exerciseId, message, expiresAt });
  const origin = event.url.origin;

  return json({ slug, url: `${origin}/s/${slug}`, expiresAt }, { status: 201 });
};

export const GET: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) throw error(401);

  const db = getDatabase();
  const shares = listUserShares(db, user.id);
  return json({ shares });
};
