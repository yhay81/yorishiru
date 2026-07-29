import {
  emptyContent,
  type ProfileBundle,
  type ProfileContent,
  type ProfileRecord,
  toPublicProfile,
} from "./domain";

export async function loadProfile(db: D1Database, id: string): Promise<ProfileRecord | null> {
  return db
    .prepare(
      `SELECT id, edit_token_hash, display_name, theme, content_json, revision,
              expires_at, created_at, updated_at
       FROM profiles
       WHERE id = ? AND expires_at >= unixepoch()`,
    )
    .bind(id)
    .first<ProfileRecord>();
}

export function decodeContent(raw: string): ProfileContent {
  try {
    return JSON.parse(raw) as ProfileContent;
  } catch {
    return emptyContent();
  }
}

export async function loadProfileBundle(db: D1Database, id: string): Promise<ProfileBundle | null> {
  const profile = await loadProfile(db, id);
  if (!profile) return null;
  return {
    content: decodeContent(profile.content_json),
    profile: toPublicProfile(profile),
  };
}
