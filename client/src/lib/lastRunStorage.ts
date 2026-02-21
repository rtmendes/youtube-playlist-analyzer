/**
 * Store the last bulk analysis run in localStorage so Saved/Recent can show it
 * even when the user isn't signed in or when server save fails.
 */
const KEY = "youtube_analyzer_last_run";

export interface LastRunData {
  id: "local";
  name: string;
  completedAt: string;
  videosFetched: number;
  commentsFetched: number;
  totalViews: number;
  totalLikes: number;
  videosData: unknown[];
  commentsData: unknown[];
  inputUrls?: string;
}

export function getLastRun(): LastRunData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastRunData;
  } catch {
    return null;
  }
}

export function setLastRun(data: Omit<LastRunData, "id">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: LastRunData = { ...data, id: "local" };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearLastRun(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
