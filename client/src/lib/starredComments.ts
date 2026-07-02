const KEY = "youtube_starred_comment_ids";

export function getStarredCommentIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function toggleStarredCommentId(id: string): void {
  const set = getStarredCommentIds();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function setStarredCommentIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}
