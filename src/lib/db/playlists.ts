import { db } from './database';
import type { Playlist } from '../types/playlist';

export async function savePlaylist(playlist: Playlist): Promise<void> {
  playlist.updatedAt = Date.now();
  await db.playlists.put(structuredClone(playlist));
}

export async function loadPlaylist(id: string): Promise<Playlist | undefined> {
  return await db.playlists.get(id);
}

export async function deletePlaylist(id: string): Promise<void> {
  await db.playlists.delete(id);
}

export async function listAllPlaylists(): Promise<Playlist[]> {
  return await db.playlists.orderBy('updatedAt').reverse().toArray();
}
