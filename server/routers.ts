import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  parseYouTubeInput, 
  youtubeClient, 
  formatDuration, 
  formatCount,
} from "./youtube";
import { getDb } from "./db";
import { playlists, analysisSessions } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  youtube: router({
    parseUrl: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(({ input }) => {
        const parsed = parseYouTubeInput(input.url);
        return parsed;
      }),

    getPlaylist: publicProcedure
      .input(z.object({ 
        playlistId: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        const response = await youtubeClient.getPlaylist(input.playlistId);
        
        if (!response.items || response.items.length === 0) {
          throw new Error("Playlist not found");
        }

        const playlist = response.items[0];
        const db = await getDb();
        
        if (db && ctx.user) {
          const thumbnailUrl = playlist.snippet.thumbnails.maxres?.url ||
            playlist.snippet.thumbnails.high?.url ||
            playlist.snippet.thumbnails.medium?.url ||
            playlist.snippet.thumbnails.default?.url || null;

          await db.insert(playlists).values({
            youtubeId: playlist.id,
            title: playlist.snippet.title,
            description: playlist.snippet.description,
            channelId: playlist.snippet.channelId,
            channelTitle: playlist.snippet.channelTitle,
            thumbnailUrl,
            videoCount: playlist.contentDetails?.itemCount || 0,
            publishedAt: new Date(playlist.snippet.publishedAt),
            rawData: playlist,
            userId: ctx.user.id,
          }).onDuplicateKeyUpdate({
            set: {
              title: playlist.snippet.title,
              description: playlist.snippet.description,
              videoCount: playlist.contentDetails?.itemCount || 0,
              rawData: playlist,
            },
          });
        }

        return {
          id: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          channelId: playlist.snippet.channelId,
          channelTitle: playlist.snippet.channelTitle,
          thumbnailUrl: playlist.snippet.thumbnails.maxres?.url ||
            playlist.snippet.thumbnails.high?.url ||
            playlist.snippet.thumbnails.medium?.url,
          videoCount: playlist.contentDetails?.itemCount || 0,
          publishedAt: playlist.snippet.publishedAt,
        };
      }),

    getPlaylistVideos: publicProcedure
      .input(z.object({ 
        playlistId: z.string(),
        apiKey: z.string(),
        pageToken: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        const playlistItems = await youtubeClient.getPlaylistItems(
          input.playlistId,
          input.pageToken,
          50
        );

        const videoIds = playlistItems.items
          .filter(item => item.snippet.resourceId.videoId)
          .map(item => item.snippet.resourceId.videoId);

        const allVideos: any[] = [];
        if (videoIds.length > 0) {
          for (let i = 0; i < videoIds.length; i += 50) {
            const batch = videoIds.slice(i, i + 50);
            const videoResponse = await youtubeClient.getVideos(batch);
            allVideos.push(...videoResponse.items);
          }
        }

        return {
          videos: allVideos.map(video => ({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            thumbnailUrl: video.snippet.thumbnails.medium?.url ||
              video.snippet.thumbnails.default?.url,
            duration: video.contentDetails?.duration || "",
            durationFormatted: formatDuration(video.contentDetails?.duration || ""),
            viewCount: parseInt(video.statistics?.viewCount || "0"),
            viewCountFormatted: formatCount(parseInt(video.statistics?.viewCount || "0")),
            likeCount: parseInt(video.statistics?.likeCount || "0"),
            likeCountFormatted: formatCount(parseInt(video.statistics?.likeCount || "0")),
            commentCount: parseInt(video.statistics?.commentCount || "0"),
            commentCountFormatted: formatCount(parseInt(video.statistics?.commentCount || "0")),
            publishedAt: video.snippet.publishedAt,
            tags: video.snippet.tags || [],
          })),
          nextPageToken: playlistItems.nextPageToken,
          totalFetched: allVideos.length,
          hasMore: !!playlistItems.nextPageToken,
        };
      }),

    getVideoComments: publicProcedure
      .input(z.object({ 
        videoId: z.string(),
        apiKey: z.string(),
        pageToken: z.string().optional(),
        maxResults: z.number().min(1).max(100).default(100),
      }))
      .mutation(async ({ input }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        try {
          const response = await youtubeClient.getCommentThreads(
            input.videoId,
            input.pageToken,
            input.maxResults
          );

          const comments = response.items.map(thread => ({
            id: thread.id,
            videoId: thread.snippet.videoId,
            authorDisplayName: thread.snippet.topLevelComment.snippet.authorDisplayName,
            authorProfileImageUrl: thread.snippet.topLevelComment.snippet.authorProfileImageUrl,
            authorChannelId: thread.snippet.topLevelComment.snippet.authorChannelId?.value,
            textDisplay: thread.snippet.topLevelComment.snippet.textDisplay,
            textOriginal: thread.snippet.topLevelComment.snippet.textOriginal,
            likeCount: thread.snippet.topLevelComment.snippet.likeCount,
            replyCount: thread.snippet.totalReplyCount,
            publishedAt: thread.snippet.topLevelComment.snippet.publishedAt,
            updatedAt: thread.snippet.topLevelComment.snippet.updatedAt,
            replies: thread.replies?.comments.map(reply => ({
              id: reply.id,
              authorDisplayName: reply.snippet.authorDisplayName,
              authorProfileImageUrl: reply.snippet.authorProfileImageUrl,
              authorChannelId: reply.snippet.authorChannelId?.value,
              textDisplay: reply.snippet.textDisplay,
              textOriginal: reply.snippet.textOriginal,
              likeCount: reply.snippet.likeCount,
              publishedAt: reply.snippet.publishedAt,
              updatedAt: reply.snippet.updatedAt,
            })) || [],
          }));

          return {
            comments,
            nextPageToken: response.nextPageToken,
            totalResults: response.pageInfo.totalResults,
            hasMore: !!response.nextPageToken,
          };
        } catch (error: any) {
          if (error.response?.data?.error?.errors?.[0]?.reason === "commentsDisabled") {
            return {
              comments: [],
              nextPageToken: undefined,
              totalResults: 0,
              hasMore: false,
              commentsDisabled: true,
            };
          }
          throw error;
        }
      }),

    // Get single video details
    getVideoDetails: publicProcedure
      .input(z.object({
        videoId: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        const response = await youtubeClient.getVideos([input.videoId]);
        
        if (!response.items || response.items.length === 0) {
          throw new Error("Video not found");
        }

        const video = response.items[0];
        
        return {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          thumbnailUrl: video.snippet.thumbnails.medium?.url ||
            video.snippet.thumbnails.default?.url,
          duration: video.contentDetails?.duration || "",
          durationFormatted: formatDuration(video.contentDetails?.duration || ""),
          viewCount: parseInt(video.statistics?.viewCount || "0"),
          viewCountFormatted: formatCount(parseInt(video.statistics?.viewCount || "0")),
          likeCount: parseInt(video.statistics?.likeCount || "0"),
          likeCountFormatted: formatCount(parseInt(video.statistics?.likeCount || "0")),
          commentCount: parseInt(video.statistics?.commentCount || "0"),
          commentCountFormatted: formatCount(parseInt(video.statistics?.commentCount || "0")),
          publishedAt: video.snippet.publishedAt,
          tags: video.snippet.tags || [],
        };
      }),

    // Batch fetch comments for a single video (all pages)
    getBatchVideoComments: publicProcedure
      .input(z.object({
        videoId: z.string(),
        videoTitle: z.string().optional(),
        apiKey: z.string(),
        maxComments: z.number().min(1).max(5000).default(500),
      }))
      .mutation(async ({ input }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        const allComments: any[] = [];
        let pageToken: string | undefined;
        let fetched = 0;

        try {
          while (fetched < input.maxComments) {
            const response = await youtubeClient.getCommentThreads(
              input.videoId,
              pageToken,
              Math.min(100, input.maxComments - fetched)
            );

            for (const thread of response.items) {
              allComments.push({
                id: thread.id,
                videoId: thread.snippet.videoId,
                videoTitle: input.videoTitle || "",
                authorDisplayName: thread.snippet.topLevelComment.snippet.authorDisplayName,
                authorProfileImageUrl: thread.snippet.topLevelComment.snippet.authorProfileImageUrl,
                authorChannelId: thread.snippet.topLevelComment.snippet.authorChannelId?.value,
                textDisplay: thread.snippet.topLevelComment.snippet.textDisplay,
                textOriginal: thread.snippet.topLevelComment.snippet.textOriginal,
                likeCount: thread.snippet.topLevelComment.snippet.likeCount,
                replyCount: thread.snippet.totalReplyCount,
                publishedAt: thread.snippet.topLevelComment.snippet.publishedAt,
                replies: thread.replies?.comments.map(reply => ({
                  id: reply.id,
                  authorDisplayName: reply.snippet.authorDisplayName,
                  authorProfileImageUrl: reply.snippet.authorProfileImageUrl,
                  textDisplay: reply.snippet.textDisplay,
                  likeCount: reply.snippet.likeCount,
                  publishedAt: reply.snippet.publishedAt,
                })) || [],
              });
              fetched++;
            }

            pageToken = response.nextPageToken;
            if (!pageToken) break;
          }

          return {
            videoId: input.videoId,
            videoTitle: input.videoTitle || "",
            comments: allComments,
            totalFetched: allComments.length,
            commentsDisabled: false,
          };
        } catch (error: any) {
          if (error.response?.data?.error?.errors?.[0]?.reason === "commentsDisabled") {
            return {
              videoId: input.videoId,
              videoTitle: input.videoTitle || "",
              comments: [],
              totalFetched: 0,
              commentsDisabled: true,
            };
          }
          throw error;
        }
      }),

    // Get channel info by channel ID
    getChannelById: publicProcedure
      .input(z.object({
        channelId: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        const response = await youtubeClient.getChannelById(input.channelId);
        
        if (!response.items || response.items.length === 0) {
          throw new Error("Channel not found");
        }

        const channel = response.items[0];
        
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          thumbnailUrl: channel.snippet.thumbnails.high?.url ||
            channel.snippet.thumbnails.medium?.url ||
            channel.snippet.thumbnails.default?.url,
          uploadsPlaylistId: channel.contentDetails?.relatedPlaylists.uploads,
          subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
          videoCount: parseInt(channel.statistics?.videoCount || "0"),
          viewCount: parseInt(channel.statistics?.viewCount || "0"),
        };
      }),

    // Get channel info by handle (@username)
    getChannelByHandle: publicProcedure
      .input(z.object({
        handle: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        youtubeClient.setApiKey(input.apiKey);
        
        const response = await youtubeClient.getChannelByHandle(input.handle);
        
        if (!response.items || response.items.length === 0) {
          throw new Error("Channel not found");
        }

        const channel = response.items[0];
        
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          thumbnailUrl: channel.snippet.thumbnails.high?.url ||
            channel.snippet.thumbnails.medium?.url ||
            channel.snippet.thumbnails.default?.url,
          uploadsPlaylistId: channel.contentDetails?.relatedPlaylists.uploads,
          subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
          videoCount: parseInt(channel.statistics?.videoCount || "0"),
          viewCount: parseInt(channel.statistics?.viewCount || "0"),
        };
      }),
  }),

  analysis: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const sessions = await db
        .select()
        .from(analysisSessions)
        .where(eq(analysisSessions.userId, ctx.user.id))
        .orderBy(desc(analysisSessions.startedAt))
        .limit(20);

      return sessions;
    }),

    getPlaylistHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const userPlaylists = await db
        .select()
        .from(playlists)
        .where(eq(playlists.userId, ctx.user.id))
        .orderBy(desc(playlists.updatedAt))
        .limit(10);

      return userPlaylists;
    }),
  }),
});

export type AppRouter = typeof appRouter;
