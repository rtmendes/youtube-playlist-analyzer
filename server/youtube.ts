/**
 * YouTube API utilities for parsing URLs and fetching data
 * Based on patterns from youtube-metadata and youtube-comment-suite
 */

import axios from "axios";
import { ENV } from "./_core/env";

// YouTube URL patterns
const patterns = {
  video_id: [
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/watch\?v=([\w_-]+)(?:[\/&].*)?/i,
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/(?:v|embed|shorts|video|watch|live)\/([\w_-]+)(?:[\/&].*)?/i,
    /(?:http[s]?:\/\/)?youtu\.be\/([\w_-]+)(?:\?.*)?/i,
    /^([\w-]{11})$/i,
  ],
  playlist_id: [
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/playlist\?list=([\w_-]+)(?:&.*)?/i,
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/watch\?.*list=([\w_-]+)(?:&.*)?/i,
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/\?list=([\w_-]+)(?:&.*)?/i,
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\?list=([\w_-]+)(?:&.*)?/i,
    /^((UU|UUSH|PL|FL|SP|OLAK)[A-Za-z0-9_-]+)$/i,
  ],
  channel_id: [
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/channel\/([\w_-]+)(?:\?.*)?/i,
    /^((UC|SC)[\w-]{22})$/i,
  ],
  channel_handle: [
    /(?:http[s]?:\/\/)?(?:\w+\.)?youtube\.com\/@([^\/?]+)(?:\?.*)?/i,
  ],
};

export type InputType = "video_id" | "playlist_id" | "channel_id" | "channel_handle" | "unknown";

export interface ParsedInput {
  type: InputType;
  value: string;
  original: string;
}

/**
 * Parse a YouTube URL or ID to determine its type
 */
export function parseYouTubeInput(value: string): ParsedInput {
  const decoded = decodeURIComponent(value.trim());
  const parsed: ParsedInput = {
    type: "unknown",
    value: "",
    original: decoded,
  };

  for (const [type, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const result = regex.exec(decoded);
      if (result) {
        parsed.type = type as InputType;
        parsed.value = result[1];
        return parsed;
      }
    }
  }

  return parsed;
}

/**
 * Validate a YouTube video ID format
 */
export function isValidVideoId(videoId: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(videoId);
}

/**
 * Validate a YouTube channel ID format
 */
export function isValidChannelId(channelId: string): boolean {
  return /^(UC|SC)[A-Za-z0-9_-]{22}$/.test(channelId);
}

/**
 * Format ISO 8601 duration to human readable
 */
export function formatDuration(isoDuration: string): string {
  if (!isoDuration) return "0:00";
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCount(count: number | null | undefined): string {
  if (count === null || count === undefined) return "0";
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

// YouTube Data API types
export interface YouTubePlaylistResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubePlaylistItem[];
}

export interface YouTubePlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    localized?: { title: string; description: string };
  };
  contentDetails?: {
    itemCount: number;
  };
}

export interface YouTubePlaylistItemsResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubePlaylistVideoItem[];
}

export interface YouTubePlaylistVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    playlistId: string;
    position: number;
    resourceId: {
      kind: string;
      videoId: string;
    };
    videoOwnerChannelTitle?: string;
    videoOwnerChannelId?: string;
  };
  contentDetails?: {
    videoId: string;
    videoPublishedAt?: string;
  };
}

export interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeVideoItem[];
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    tags?: string[];
    categoryId?: string;
    liveBroadcastContent?: string;
    localized?: { title: string; description: string };
    defaultAudioLanguage?: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    projection: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    favoriteCount?: string;
    commentCount?: string;
  };
}

export interface YouTubeCommentThreadResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeCommentThread[];
}

export interface YouTubeChannelResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeChannelItem[];
}

export interface YouTubeChannelItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    localized?: { title: string; description: string };
    country?: string;
  };
  contentDetails?: {
    relatedPlaylists: {
      likes?: string;
      uploads: string;
    };
  };
  statistics?: {
    viewCount?: string;
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
}

export interface YouTubeCommentThread {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    channelId?: string;
    videoId: string;
    topLevelComment: YouTubeComment;
    canReply: boolean;
    totalReplyCount: number;
    isPublic: boolean;
  };
  replies?: {
    comments: YouTubeComment[];
  };
}

export interface YouTubeComment {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    channelId?: string;
    videoId: string;
    textDisplay: string;
    textOriginal: string;
    parentId?: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelUrl?: string;
    authorChannelId?: { value: string };
    canRate: boolean;
    viewerRating: string;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
  };
}

// YouTube API client using Data API proxy
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeAPIConfig {
  apiKey?: string;
}

class YouTubeAPIClient {
  private apiKey: string;

  constructor(config: YouTubeAPIConfig = {}) {
    this.apiKey = config.apiKey || "";
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new Error("YouTube API key is required. Please provide your API key.");
    }

    const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
    url.searchParams.set("key", this.apiKey);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    try {
      console.log(`[YouTube API] Requesting: ${endpoint}`, params);
      const response = await axios.get<T>(url.toString(), {
        timeout: 30000,
      });
      console.log(`[YouTube API] Success: ${endpoint}`);
      return response.data;
    } catch (error: any) {
      console.error(`[YouTube API] Error: ${endpoint}`, error.response?.data || error.message);
      
      // Parse YouTube API error response
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        const errorCode = apiError.code;
        const errorMessage = apiError.message;
        const errorReason = apiError.errors?.[0]?.reason;
        
        // Provide user-friendly error messages
        if (errorCode === 400) {
          if (errorReason === 'keyInvalid') {
            throw new Error('Invalid API Key: The provided YouTube API key is not valid. Please check your key in Google Cloud Console.');
          }
          if (errorReason === 'badRequest') {
            throw new Error(`Bad Request: ${errorMessage}`);
          }
          throw new Error(`API Error (400): ${errorMessage}`);
        }
        
        if (errorCode === 401) {
          throw new Error('Unauthorized: Your API key may be invalid or restricted. Please check your API key settings in Google Cloud Console.');
        }
        
        if (errorCode === 403) {
          if (errorReason === 'quotaExceeded') {
            throw new Error('Quota Exceeded: Your YouTube API quota has been exceeded. Please wait until tomorrow or request a quota increase in Google Cloud Console.');
          }
          if (errorReason === 'accessNotConfigured') {
            throw new Error('API Not Enabled: YouTube Data API v3 is not enabled for your project. Please enable it in Google Cloud Console.');
          }
          if (errorReason === 'forbidden') {
            throw new Error('Access Forbidden: Your API key does not have permission to access this resource. Check API restrictions in Google Cloud Console.');
          }
          throw new Error(`Access Denied (403): ${errorMessage}`);
        }
        
        if (errorCode === 404) {
          throw new Error(`Not Found: The requested resource was not found. ${errorMessage}`);
        }
        
        throw new Error(`YouTube API Error (${errorCode}): ${errorMessage}`);
      }
      
      // Network or other errors
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Connection Error: Unable to connect to YouTube API. Please check your internet connection.');
      }
      
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new Error('Timeout: The request to YouTube API timed out. Please try again.');
      }
      
      throw new Error(`Request Failed: ${error.message}`);
    }
  }

  async getPlaylist(playlistId: string): Promise<YouTubePlaylistResponse> {
    return this.request<YouTubePlaylistResponse>("playlists", {
      part: "snippet,contentDetails",
      id: playlistId,
    });
  }

  async getPlaylistItems(
    playlistId: string,
    pageToken?: string,
    maxResults: number = 50
  ): Promise<YouTubePlaylistItemsResponse> {
    const params: Record<string, string> = {
      part: "snippet,contentDetails",
      playlistId,
      maxResults: maxResults.toString(),
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    return this.request<YouTubePlaylistItemsResponse>("playlistItems", params);
  }

  async getVideos(videoIds: string[]): Promise<YouTubeVideoResponse> {
    return this.request<YouTubeVideoResponse>("videos", {
      part: "snippet,contentDetails,statistics",
      id: videoIds.join(","),
    });
  }

  async getCommentThreads(
    videoId: string,
    pageToken?: string,
    maxResults: number = 100,
    order: "time" | "relevance" = "time"
  ): Promise<YouTubeCommentThreadResponse> {
    const params: Record<string, string> = {
      part: "snippet,replies",
      videoId,
      maxResults: maxResults.toString(),
      order,
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    return this.request<YouTubeCommentThreadResponse>("commentThreads", params);
  }

  async getCommentReplies(
    parentId: string,
    pageToken?: string,
    maxResults: number = 100
  ): Promise<{ items: YouTubeComment[]; nextPageToken?: string }> {
    const params: Record<string, string> = {
      part: "snippet",
      parentId,
      maxResults: maxResults.toString(),
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    return this.request("comments", params);
  }

  async getChannelById(channelId: string): Promise<YouTubeChannelResponse> {
    return this.request<YouTubeChannelResponse>("channels", {
      part: "snippet,contentDetails,statistics",
      id: channelId,
    });
  }

  async getChannelByHandle(handle: string): Promise<YouTubeChannelResponse> {
    // Remove @ if present
    const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
    return this.request<YouTubeChannelResponse>("channels", {
      part: "snippet,contentDetails,statistics",
      forHandle: cleanHandle,
    });
  }

  async getChannelByUsername(username: string): Promise<YouTubeChannelResponse> {
    return this.request<YouTubeChannelResponse>("channels", {
      part: "snippet,contentDetails,statistics",
      forUsername: username,
    });
  }
}

export const youtubeClient = new YouTubeAPIClient();
