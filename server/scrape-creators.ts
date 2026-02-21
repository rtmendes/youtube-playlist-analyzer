/**
 * Scrape Creators API client for TikTok video and comments.
 * Base: https://api.scrapecreators.com, auth: x-api-key header.
 */

import type { TikTokVideoInfo, TikTokCreatorInfo, TikTokCommentInfo } from "./tiktok";

const BASE = "https://api.scrapecreators.com";

function getHeaders(apiKey: string): Record<string, string> {
  return {
    "x-api-key": apiKey,
    "Accept": "application/json",
  };
}

/** Raw video response shape from GET /v2/tiktok/video (subset we use) */
interface ScrapeCreatorsVideoPayload {
  aweme_detail?: {
    added_sound_music_info?: {
      create_time?: number;
      duration?: number;
      id_str?: string;
      owner_nickname?: string;
      owner_handle?: string;
      owner_id?: string;
      title?: string;
      author?: string;
    };
  };
  author?: {
    nickname?: string;
    unique_id?: string;
    signature?: string;
    follower_count?: number;
    following_count?: number;
    total_favorited?: number;
    aweme_count?: number;
    avatar_thumb?: { url_list?: string[] };
    avatar_larger?: { url_list?: string[] };
    avatar_medium?: { url_list?: string[] };
  };
  statistics?: {
    aweme_id?: string;
    play_count?: number;
    digg_count?: number;
    share_count?: number;
    comment_count?: number;
    collect_count?: number;
  };
  desc?: string;
  video?: {
    cover?: { url_list?: string[] };
  };
  text_extra?: Array<{ hashtag_name?: string }>;
}

/**
 * Fetch TikTok video info from Scrape Creators.
 * @param apiKey - Scrape Creators API key
 * @param videoUrl - Full TikTok video URL (e.g. https://www.tiktok.com/@user/video/123)
 * @returns Normalized TikTokVideoInfo or null on error
 */
export async function fetchTikTokVideo(
  apiKey: string,
  videoUrl: string
): Promise<TikTokVideoInfo | null> {
  const url = `${BASE}/v2/tiktok/video?url=${encodeURIComponent(videoUrl)}`;
  try {
    const res = await fetch(url, { headers: getHeaders(apiKey) });
    if (!res.ok) return null;
    const data = (await res.json()) as ScrapeCreatorsVideoPayload;
    return mapVideoResponse(data, videoUrl);
  } catch {
    return null;
  }
}

function mapVideoResponse(data: ScrapeCreatorsVideoPayload, videoUrl: string): TikTokVideoInfo | null {
  const stats = data.statistics;
  const author = data.author;
  const music = data.aweme_detail?.added_sound_music_info;
  const videoId =
    stats?.aweme_id ??
    music?.id_str ??
    (/\d{15,25}/.exec(videoUrl)?.[0] ?? "unknown");
  if (!videoId || videoId === "unknown") return null;

  const avatarUrl =
    author?.avatar_larger?.url_list?.[0] ??
    author?.avatar_medium?.url_list?.[0] ??
    author?.avatar_thumb?.url_list?.[0] ??
    "";
  const creator: TikTokCreatorInfo = {
    uniqueId: author?.unique_id ?? music?.owner_handle ?? "unknown",
    nickname: author?.nickname ?? music?.owner_nickname ?? "Unknown",
    avatarUrl,
    signature: author?.signature ?? "",
    verified: false,
    followerCount: author?.follower_count ?? 0,
    followingCount: author?.following_count ?? 0,
    heartCount: author?.total_favorited ?? 0,
    videoCount: author?.aweme_count ?? 0,
  };

  const coverUrl =
    data.video?.cover?.url_list?.[0] ?? "";
  const createTime = music?.create_time
    ? new Date(music.create_time * 1000)
    : new Date(0);

  const hashtags: string[] = [];
  if (Array.isArray(data.text_extra)) {
    for (const e of data.text_extra) {
      if (e.hashtag_name) hashtags.push(e.hashtag_name);
    }
  }
  if (hashtags.length === 0 && typeof data.desc === "string") {
    const matches = data.desc.match(/#(\w+)/g);
    if (matches) for (const m of matches) hashtags.push(m.replace("#", ""));
  }

  return {
    videoId,
    description: data.desc ?? "",
    coverUrl,
    duration: music?.duration ?? 0,
    playCount: stats?.play_count ?? 0,
    diggCount: stats?.digg_count ?? 0,
    shareCount: stats?.share_count ?? 0,
    commentCount: stats?.comment_count ?? 0,
    collectCount: stats?.collect_count ?? 0,
    createTime,
    musicId: music?.id_str,
    musicTitle: music?.title,
    musicAuthor: music?.author ?? music?.owner_nickname,
    hashtags,
    creator,
  };
}

/** Raw comment item from GET /v1/tiktok/video/comments */
interface ScrapeCreatorsCommentItem {
  cid?: string;
  text?: string;
  user?: { nickname?: string; unique_id?: string; avatar_thumb?: { url_list?: string[] } };
  digg_count?: number;
  reply_comment_total?: number;
  create_time?: number;
}

/** Raw comments response */
interface ScrapeCreatorsCommentsPayload {
  comments?: ScrapeCreatorsCommentItem[];
  cursor?: number;
  has_more?: boolean;
}

/**
 * Fetch TikTok video comments from Scrape Creators.
 * @param apiKey - Scrape Creators API key
 * @param videoUrl - Full TikTok video URL
 * @param cursor - Optional pagination cursor
 * @returns Normalized comments and next cursor/hasMore
 */
export async function fetchTikTokComments(
  apiKey: string,
  videoUrl: string,
  cursor?: number
): Promise<{ comments: TikTokCommentInfo[]; cursor?: number; hasMore: boolean }> {
  const params = new URLSearchParams({ url: videoUrl });
  if (cursor != null) params.set("cursor", String(cursor));
  const url = `${BASE}/v1/tiktok/video/comments?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: getHeaders(apiKey) });
    if (!res.ok) return { comments: [], hasMore: false };
    const data = (await res.json()) as ScrapeCreatorsCommentsPayload;
    const list = Array.isArray(data.comments) ? data.comments : [];
    const videoId = /\d{15,25}/.exec(videoUrl)?.[0] ?? "unknown";
    const comments: TikTokCommentInfo[] = list.map((c) => ({
      commentId: String(c.cid ?? ""),
      videoId,
      authorUniqueId: c.user?.unique_id ?? "",
      authorNickname: c.user?.nickname ?? "",
      authorAvatarUrl: c.user?.avatar_thumb?.url_list?.[0] ?? "",
      text: c.text ?? "",
      diggCount: c.digg_count ?? 0,
      replyCount: c.reply_comment_total ?? 0,
      createTime: c.create_time ? new Date(c.create_time * 1000) : new Date(0),
    })).filter((c) => c.commentId);
    return {
      comments,
      cursor: data.cursor,
      hasMore: Boolean(data.has_more),
    };
  } catch {
    return { comments: [], hasMore: false };
  }
}
