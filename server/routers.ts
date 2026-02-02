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
import { playlists, analysisSessions, projects, folders, tags, projectTags, commentInsights, generatedAssets, amazonProducts, amazonReviews, redditPosts, redditComments, researchSessions, multiSourceInsights, savedPlaylists, playlistRuns, playlistVideos, videos, comments, tiktokCreators, tiktokVideos, tiktokComments, savedComments, commentCollections, nlpAnalysisResults, contentTemplates, aiPromptsKnowledgeBase, croBestPractices, copywritingFrameworks, savedTemplates, contentVersions, exportHistory, contentSchedules, templateShares, abTestResults, scheduleGoals, templateComments, commentLikes, competitors, competitorProducts, competitorContent, competitorComparisons, users, competitorAlerts, alertHistory, competitorYouTubeChannels, youtubeChannelComparisons, competitorContentCalendar, competitorReports, reportSchedules, postingPatterns } from "../drizzle/schema";
import { allPrompts, getPromptsForType, getPromptById, copywritingFrameworks as frameworksData, croBestPractices as croPracticesData, ContentPrompt } from "./content-prompts";
import { invokeLLM } from "./_core/llm";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { parseAmazonUrl, generateSampleProduct, generateSampleReviews, calculateReviewStats, analyzeReviewSentiment, fetchAmazonProduct, fetchAmazonReviews, searchAmazonProducts, compareProducts, AmazonApiConfig } from "./amazon";
import { parseRedditUrl, fetchSubredditPosts, searchReddit, fetchPostComments, analyzeRedditComment, calculateRedditStats, getPopularResearchSubreddits, fetchSubredditPostsWithFallback, searchRedditWithFallback, fetchPostCommentsWithFallback, generateSamplePosts, generateSampleComments as generateSampleRedditComments } from "./reddit";
import { parseTikTokUrl, generateSampleVideo, generateSampleCreator, generateSampleComments as generateSampleTikTokComments, analyzeTikTokSentiment, extractTrendingHashtags, TikTokVideoInfo } from "./tiktok";

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
        .select({
          id: analysisSessions.id,
          name: analysisSessions.name,
          inputUrls: analysisSessions.inputUrls,
          status: analysisSessions.status,
          videosFetched: analysisSessions.videosFetched,
          commentsFetched: analysisSessions.commentsFetched,
          totalViews: analysisSessions.totalViews,
          totalLikes: analysisSessions.totalLikes,
          startedAt: analysisSessions.startedAt,
          completedAt: analysisSessions.completedAt,
        })
        .from(analysisSessions)
        .where(eq(analysisSessions.userId, ctx.user.id))
        .orderBy(desc(analysisSessions.startedAt))
        .limit(50);

      return sessions;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;

        const session = await db
          .select()
          .from(analysisSessions)
          .where(eq(analysisSessions.id, input.id))
          .limit(1);

        if (!session[0] || session[0].userId !== ctx.user.id) {
          throw new Error("Analysis not found");
        }

        return session[0];
      }),

    save: protectedProcedure
      .input(z.object({
        name: z.string(),
        inputUrls: z.string(),
        videosFetched: z.number(),
        commentsFetched: z.number(),
        totalViews: z.number(),
        totalLikes: z.number(),
        videosData: z.any(),
        commentsData: z.any(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(analysisSessions).values({
          userId: ctx.user.id,
          name: input.name,
          inputUrls: input.inputUrls,
          status: "completed",
          videosFetched: input.videosFetched,
          commentsFetched: input.commentsFetched,
          totalViews: input.totalViews,
          totalLikes: input.totalLikes,
          videosData: input.videosData,
          commentsData: input.commentsData,
          completedAt: new Date(),
        });

        return { id: Number((result as any)[0]?.insertId || 0), success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify ownership
        const session = await db
          .select({ userId: analysisSessions.userId })
          .from(analysisSessions)
          .where(eq(analysisSessions.id, input.id))
          .limit(1);

        if (!session[0] || session[0].userId !== ctx.user.id) {
          throw new Error("Analysis not found");
        }

        await db.delete(analysisSessions).where(eq(analysisSessions.id, input.id));
        return { success: true };
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

  // Folders management
  folders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(folders).where(eq(folders.userId, ctx.user.id)).orderBy(desc(folders.createdAt));
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), color: z.string().optional(), parentFolderId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(folders).values({ userId: ctx.user.id, ...input });
        return { id: Number((result as any)[0]?.insertId || 0), success: true };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional(), parentFolderId: z.number().nullable().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { id, ...updates } = input;
        await db.update(folders).set(updates).where(eq(folders.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(folders).where(eq(folders.id, input.id));
        return { success: true };
      }),
  }),

  // Tags management
  tags: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(tags).where(eq(tags.userId, ctx.user.id)).orderBy(tags.name);
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), color: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(tags).values({ userId: ctx.user.id, ...input });
        return { id: Number((result as any)[0]?.insertId || 0), success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(tags).where(eq(tags.id, input.id));
        return { success: true };
      }),
  }),

  // Projects management
  projects: router({
    list: protectedProcedure
      .input(z.object({ folderId: z.number().optional(), tagId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        
        let query = db.select().from(projects).where(eq(projects.userId, ctx.user.id));
        
        if (input?.folderId) {
          query = db.select().from(projects).where(eq(projects.folderId, input.folderId));
        }
        
        return await query.orderBy(desc(projects.updatedAt));
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
        if (!result[0] || result[0].userId !== ctx.user.id) throw new Error("Project not found");
        return result[0];
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        folderId: z.number().optional(),
        analysisSessionId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(projects).values({ userId: ctx.user.id, ...input });
        return { id: Number((result as any)[0]?.insertId || 0), success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        folderId: z.number().optional().nullable(),
        searchQueries: z.any().optional(),
        selectedComments: z.any().optional(),
        audienceInsights: z.any().optional(),
        psychographicProfile: z.any().optional(),
        canvasState: z.any().optional(),
        generatedAssets: z.any().optional(),
        status: z.enum(["draft", "active", "archived"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { id, ...updates } = input;
        await db.update(projects).set(updates).where(eq(projects.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(projects).where(eq(projects.id, input.id));
        return { success: true };
      }),

    addTag: protectedProcedure
      .input(z.object({ projectId: z.number(), tagId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(projectTags).values(input);
        return { success: true };
      }),

    removeTag: protectedProcedure
      .input(z.object({ projectId: z.number(), tagId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(projectTags).where(eq(projectTags.projectId, input.projectId));
        return { success: true };
      }),

    getTags: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        const pts = await db.select().from(projectTags).where(eq(projectTags.projectId, input.projectId));
        const tagIds = pts.map(pt => pt.tagId);
        if (tagIds.length === 0) return [];
        return await db.select().from(tags).where(eq(tags.userId, ctx.user.id));
      }),
  }),

  // Comment Insights
  insights: router({
    saveComments: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        comments: z.array(z.object({
          commentId: z.string(),
          videoId: z.string().optional(),
          videoTitle: z.string().optional(),
          authorName: z.string().optional(),
          commentText: z.string(),
          likeCount: z.number().optional(),
          replyCount: z.number().optional(),
          category: z.enum(["personal_story", "testimonial", "product_request", "pain_point", "humor", "question", "praise", "criticism", "suggestion", "other"]).optional(),
          sentimentScore: z.number().optional(),
          marketingPotential: z.number().optional(),
          extractedInsights: z.any().optional(),
          suggestedUses: z.any().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        for (const comment of input.comments) {
          await db.insert(commentInsights).values({
            projectId: input.projectId,
            ...comment,
          });
        }
        
        return { success: true, count: input.comments.length };
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number(), category: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(commentInsights).where(eq(commentInsights.projectId, input.projectId)).orderBy(desc(commentInsights.marketingPotential));
      }),

    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(["personal_story", "testimonial", "product_request", "pain_point", "humor", "question", "praise", "criticism", "suggestion", "other"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(commentInsights).set({ category: input.category }).where(eq(commentInsights.id, input.id));
        return { success: true };
      }),

    toggleSelected: protectedProcedure
      .input(z.object({ id: z.number(), isSelected: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(commentInsights).set({ isSelected: input.isSelected ? 1 : 0 }).where(eq(commentInsights.id, input.id));
        return { success: true };
      }),
  }),

  // Generated Assets
  assets: router({
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        type: z.enum(["advertorial", "vsl_script", "ugc_scenario", "ebook_outline", "course_structure", "ad_copy", "sales_page", "product_offer", "email_sequence", "social_post", "testimonial_formatted", "custom"]),
        title: z.string(),
        content: z.string(),
        sourceCommentIds: z.array(z.string()).optional(),
        generationPrompt: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const result = await db.insert(generatedAssets).values(input);
        return { id: Number((result as any)[0]?.insertId || 0), success: true };
      }),

    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(generatedAssets).where(eq(generatedAssets.projectId, input.projectId)).orderBy(desc(generatedAssets.createdAt));
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional(), isFavorite: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { id, isFavorite, ...updates } = input;
        await db.update(generatedAssets).set({ ...updates, isFavorite: isFavorite ? 1 : 0 }).where(eq(generatedAssets.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(generatedAssets).where(eq(generatedAssets.id, input.id));
        return { success: true };
      }),
  }),

  // Amazon Intelligence Router
  amazon: router({
    parseUrl: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(({ input }) => {
        return parseAmazonUrl(input.url);
      }),

    getProduct: publicProcedure
      .input(z.object({ 
        asin: z.string(),
        apiKey: z.string().optional(),
        apiProvider: z.enum(["rainforest", "scraperapi", "sample"]).default("sample"),
        marketplace: z.string().default("com"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        
        // Check if product exists in database (unless forcing refresh)
        if (db) {
          const existing = await db.select().from(amazonProducts).where(eq(amazonProducts.asin, input.asin)).limit(1);
          if (existing.length > 0 && !input.apiKey) {
            return existing[0];
          }
        }

        // Configure API
        const apiConfig: AmazonApiConfig = {
          provider: input.apiProvider,
          apiKey: input.apiKey,
        };

        // Fetch product from API or generate sample
        const product = await fetchAmazonProduct(input.asin, apiConfig, input.marketplace);
        if (!product) {
          throw new Error("Failed to fetch product data");
        }
        
        // Save to database
        if (db && ctx.user) {
          await db.insert(amazonProducts).values({
            userId: ctx.user.id,
            asin: product.asin,
            title: product.title,
            description: product.description,
            brand: product.brand,
            price: product.price,
            rating: product.rating,
            reviewCount: product.reviewCount,
            imageUrl: product.imageUrl,
            productUrl: product.productUrl,
            category: product.category,
            features: product.features,
          }).onDuplicateKeyUpdate({
            set: { updatedAt: new Date() },
          });
        }

        return product;
      }),

    getReviews: publicProcedure
      .input(z.object({ 
        asin: z.string(),
        count: z.number().min(1).max(100).default(20),
        apiKey: z.string().optional(),
        apiProvider: z.enum(["rainforest", "scraperapi", "sample"]).default("sample"),
        marketplace: z.string().default("com"),
        forceRefresh: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        
        // Check if reviews exist in database (unless forcing refresh)
        if (db && !input.forceRefresh) {
          const productResult = await db.select().from(amazonProducts).where(eq(amazonProducts.asin, input.asin)).limit(1);
          if (productResult.length > 0) {
            const existingReviews = await db.select().from(amazonReviews).where(eq(amazonReviews.productId, productResult[0].id));
            if (existingReviews.length > 0) {
              return {
                reviews: existingReviews,
                stats: calculateReviewStats(existingReviews.map(r => ({
                  reviewId: r.reviewId || '',
                  author: r.author || '',
                  rating: r.rating || 0,
                  title: r.title || '',
                  body: r.body || '',
                  helpfulVotes: r.helpfulVotes || 0,
                  verified: r.verified === 1,
                  reviewDate: r.reviewDate || new Date(),
                }))),
              };
            }
          }
        }

        // Configure API
        const apiConfig: AmazonApiConfig = {
          provider: input.apiProvider,
          apiKey: input.apiKey,
        };

        // Fetch reviews from API or generate sample
        const reviews = await fetchAmazonReviews(input.asin, apiConfig, input.marketplace, Math.ceil(input.count / 10));
        const stats = calculateReviewStats(reviews);

        // Save to database
        if (db && ctx.user) {
          const productResult = await db.select().from(amazonProducts).where(eq(amazonProducts.asin, input.asin)).limit(1);
          if (productResult.length > 0) {
            for (const review of reviews) {
              const analysis = analyzeReviewSentiment(review);
              await db.insert(amazonReviews).values({
                productId: productResult[0].id,
                reviewId: review.reviewId,
                author: review.author,
                rating: review.rating,
                title: review.title,
                body: review.body,
                helpfulVotes: review.helpfulVotes,
                verified: review.verified ? 1 : 0,
                reviewDate: review.reviewDate,
                sentiment: analysis.sentiment,
                themes: analysis.themes,
                painPoints: analysis.painPoints,
                praises: analysis.praises,
              }).onDuplicateKeyUpdate({
                set: { createdAt: new Date() },
              });
            }
          }
        }

        return { reviews, stats };
      }),

    listProducts: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(amazonProducts).where(eq(amazonProducts.userId, ctx.user.id)).orderBy(desc(amazonProducts.createdAt));
      }),

    deleteProduct: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Delete reviews first
        await db.delete(amazonReviews).where(eq(amazonReviews.productId, input.id));
        // Then delete product
        await db.delete(amazonProducts).where(and(eq(amazonProducts.id, input.id), eq(amazonProducts.userId, ctx.user.id)));
        return { success: true };
      }),

    searchProducts: publicProcedure
      .input(z.object({
        query: z.string(),
        apiKey: z.string().optional(),
        apiProvider: z.enum(["rainforest", "scraperapi", "sample"]).default("sample"),
        marketplace: z.string().default("com"),
      }))
      .mutation(async ({ input }) => {
        const apiConfig: AmazonApiConfig = {
          provider: input.apiProvider,
          apiKey: input.apiKey,
        };
        return await searchAmazonProducts(input.query, apiConfig, input.marketplace);
      }),

    compareProducts: publicProcedure
      .input(z.object({
        asins: z.array(z.string()).min(2).max(5),
        apiKey: z.string().optional(),
        apiProvider: z.enum(["rainforest", "scraperapi", "sample"]).default("sample"),
        marketplace: z.string().default("com"),
      }))
      .mutation(async ({ input }) => {
        const apiConfig: AmazonApiConfig = {
          provider: input.apiProvider,
          apiKey: input.apiKey,
        };

        // Fetch all products and their reviews
        const products = await Promise.all(
          input.asins.map(asin => fetchAmazonProduct(asin, apiConfig, input.marketplace))
        );
        
        const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== null);
        
        const reviewsMap = new Map();
        for (const product of validProducts) {
          const reviews = await fetchAmazonReviews(product.asin, apiConfig, input.marketplace, 2);
          reviewsMap.set(product.asin, reviews);
        }

        return compareProducts(validProducts, reviewsMap);
      }),
  }),

  // Reddit Research Router
  reddit: router({
    parseUrl: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(({ input }) => {
        return parseRedditUrl(input.url);
      }),

    getSubredditPosts: publicProcedure
      .input(z.object({
        subreddit: z.string(),
        sort: z.enum(["hot", "new", "top", "rising"]).default("hot"),
        limit: z.number().min(1).max(100).default(25),
        after: z.string().optional(),
        timeframe: z.enum(["hour", "day", "week", "month", "year", "all"]).default("week"),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await fetchSubredditPostsWithFallback(
          input.subreddit,
          input.sort,
          input.limit,
          input.after,
          input.timeframe
        );

        // Save posts to database
        const db = await getDb();
        if (db && ctx.user) {
          for (const post of result.posts) {
            await db.insert(redditPosts).values({
              userId: ctx.user.id,
              postId: post.postId,
              subreddit: post.subreddit,
              title: post.title,
              body: post.body,
              author: post.author,
              score: post.score,
              upvoteRatio: String(post.upvoteRatio),
              commentCount: post.commentCount,
              postUrl: post.postUrl,
              isNsfw: post.isNsfw ? 1 : 0,
              flair: post.flair,
              mediaUrl: post.mediaUrl,
              postedAt: post.postedAt,
            }).onDuplicateKeyUpdate({
              set: { score: post.score, commentCount: post.commentCount, updatedAt: new Date() },
            });
          }
        }

        return result;
      }),

    searchPosts: publicProcedure
      .input(z.object({
        query: z.string(),
        subreddit: z.string().optional(),
        sort: z.enum(["relevance", "hot", "top", "new", "comments"]).default("relevance"),
        limit: z.number().min(1).max(100).default(25),
        after: z.string().optional(),
        timeframe: z.enum(["hour", "day", "week", "month", "year", "all"]).default("all"),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await searchRedditWithFallback(
          input.query,
          input.subreddit,
          input.sort,
          input.limit,
          input.after,
          input.timeframe
        );

        // Save posts to database
        const db = await getDb();
        if (db && ctx.user) {
          for (const post of result.posts) {
            await db.insert(redditPosts).values({
              userId: ctx.user.id,
              postId: post.postId,
              subreddit: post.subreddit,
              title: post.title,
              body: post.body,
              author: post.author,
              score: post.score,
              upvoteRatio: String(post.upvoteRatio),
              commentCount: post.commentCount,
              postUrl: post.postUrl,
              isNsfw: post.isNsfw ? 1 : 0,
              flair: post.flair,
              mediaUrl: post.mediaUrl,
              postedAt: post.postedAt,
            }).onDuplicateKeyUpdate({
              set: { score: post.score, commentCount: post.commentCount, updatedAt: new Date() },
            });
          }
        }

        return result;
      }),

    getPostComments: publicProcedure
      .input(z.object({
        subreddit: z.string(),
        postId: z.string(),
        sort: z.enum(["best", "top", "new", "controversial", "old", "qa"]).default("best"),
        limit: z.number().min(1).max(500).default(100),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await fetchPostCommentsWithFallback(
          input.subreddit,
          input.postId,
          input.sort,
          input.limit
        );

        // Save comments to database
        const db = await getDb();
        if (db && ctx.user) {
          // First, get or create the post record
          const postResult = await db.select().from(redditPosts).where(eq(redditPosts.postId, input.postId)).limit(1);
          let dbPostId: number;
          
          if (postResult.length > 0) {
            dbPostId = postResult[0].id;
          } else {
            const insertResult = await db.insert(redditPosts).values({
              userId: ctx.user.id,
              postId: result.post.postId,
              subreddit: result.post.subreddit,
              title: result.post.title,
              body: result.post.body,
              author: result.post.author,
              score: result.post.score,
              upvoteRatio: String(result.post.upvoteRatio),
              commentCount: result.post.commentCount,
              postUrl: result.post.postUrl,
              isNsfw: result.post.isNsfw ? 1 : 0,
              flair: result.post.flair,
              mediaUrl: result.post.mediaUrl,
              postedAt: result.post.postedAt,
            });
            // Get the newly inserted post ID
            const newPost = await db.select().from(redditPosts).where(eq(redditPosts.postId, result.post.postId)).limit(1);
            dbPostId = newPost[0]?.id || 0;
          }

          // Save comments
          for (const comment of result.comments) {
            const analysis = analyzeRedditComment(comment);
            await db.insert(redditComments).values({
              postId: dbPostId,
              commentId: comment.commentId,
              parentCommentId: comment.parentCommentId,
              author: comment.author,
              body: comment.body,
              score: comment.score,
              isOp: comment.isOp ? 1 : 0,
              depth: comment.depth,
              postedAt: comment.postedAt,
              sentiment: analysis.sentiment,
              themes: analysis.themes,
            }).onDuplicateKeyUpdate({
              set: { score: comment.score, createdAt: new Date() },
            });
          }
        }

        // Calculate stats
        const stats = calculateRedditStats([result.post], result.comments);

        return { ...result, stats };
      }),

    getPopularSubreddits: publicProcedure
      .query(() => {
        return getPopularResearchSubreddits();
      }),

    listPosts: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(redditPosts).where(eq(redditPosts.userId, ctx.user.id)).orderBy(desc(redditPosts.createdAt)).limit(100);
      }),

    deletePost: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        // Delete comments first
        await db.delete(redditComments).where(eq(redditComments.postId, input.id));
        // Then delete post
        await db.delete(redditPosts).where(and(eq(redditPosts.id, input.id), eq(redditPosts.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  // Multi-Source Insights Router
  multiInsights: router({
    addToProject: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        sourceType: z.enum(["youtube", "amazon", "reddit"]),
        sourceId: z.string(),
        sourceTitle: z.string().optional(),
        authorName: z.string().optional(),
        contentText: z.string(),
        engagementScore: z.number().default(0),
        category: z.enum([
          "personal_story", "testimonial", "product_request", "pain_point",
          "humor", "question", "praise", "criticism", "suggestion",
          "comparison", "recommendation", "warning", "tip", "other"
        ]).default("other"),
        sentiment: z.enum(["positive", "neutral", "negative"]).default("neutral"),
        marketingPotential: z.number().min(0).max(100).default(50),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(multiSourceInsights).values({
          projectId: input.projectId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          sourceTitle: input.sourceTitle,
          authorName: input.authorName,
          contentText: input.contentText,
          engagementScore: input.engagementScore,
          category: input.category,
          sentiment: input.sentiment,
          marketingPotential: input.marketingPotential,
          isSelected: 1,
        });

        return { success: true };
      }),

    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(multiSourceInsights).where(eq(multiSourceInsights.projectId, input.projectId)).orderBy(desc(multiSourceInsights.createdAt));
      }),

    listBySource: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        sourceType: z.enum(["youtube", "amazon", "reddit"]),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(multiSourceInsights).where(
          and(
            eq(multiSourceInsights.projectId, input.projectId),
            eq(multiSourceInsights.sourceType, input.sourceType)
          )
        ).orderBy(desc(multiSourceInsights.createdAt));
      }),

    updateSelection: protectedProcedure
      .input(z.object({ id: z.number(), isSelected: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(multiSourceInsights).set({ isSelected: input.isSelected ? 1 : 0 }).where(eq(multiSourceInsights.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(multiSourceInsights).where(eq(multiSourceInsights.id, input.id));
        return { success: true };
      }),

    getStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { youtube: 0, amazon: 0, reddit: 0, total: 0 };
        
        const insights = await db.select().from(multiSourceInsights).where(eq(multiSourceInsights.projectId, input.projectId));
        
        return {
          youtube: insights.filter(i => i.sourceType === "youtube").length,
          amazon: insights.filter(i => i.sourceType === "amazon").length,
          reddit: insights.filter(i => i.sourceType === "reddit").length,
          total: insights.length,
        };
      }),
  }),

  // Saved Playlists Router
  savedPlaylists: router({
    // Save a playlist to library
    save: protectedProcedure
      .input(z.object({
        youtubePlaylistId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        channelTitle: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        videoCount: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Check if already saved
        const existing = await db.select().from(savedPlaylists).where(
          and(
            eq(savedPlaylists.userId, ctx.user.id),
            eq(savedPlaylists.youtubePlaylistId, input.youtubePlaylistId)
          )
        );

        if (existing.length > 0) {
          // Update existing
          await db.update(savedPlaylists).set({
            title: input.title,
            description: input.description,
            channelTitle: input.channelTitle,
            thumbnailUrl: input.thumbnailUrl,
            videoCount: input.videoCount,
            lastRunAt: new Date(),
          }).where(eq(savedPlaylists.id, existing[0].id));
          return { id: existing[0].id, isNew: false };
        }

        // Create new
        const result = await db.insert(savedPlaylists).values({
          userId: ctx.user.id,
          youtubePlaylistId: input.youtubePlaylistId,
          title: input.title,
          description: input.description,
          channelTitle: input.channelTitle,
          thumbnailUrl: input.thumbnailUrl,
          videoCount: input.videoCount,
          lastRunAt: new Date(),
          status: "active",
        });

        return { id: Number((result as any)[0]?.insertId || 0), isNew: true };
      }),

    // Get all saved playlists for user
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        return await db.select().from(savedPlaylists)
          .where(eq(savedPlaylists.userId, ctx.user.id))
          .orderBy(desc(savedPlaylists.lastRunAt));
      }),

    // Get a single saved playlist with details
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const results = await db.select().from(savedPlaylists)
          .where(
            and(
              eq(savedPlaylists.id, input.id),
              eq(savedPlaylists.userId, ctx.user.id)
            )
          );

        return results[0] || null;
      }),

    // Get by YouTube playlist ID
    getByYoutubeId: protectedProcedure
      .input(z.object({ youtubePlaylistId: z.string() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const results = await db.select().from(savedPlaylists)
          .where(
            and(
              eq(savedPlaylists.youtubePlaylistId, input.youtubePlaylistId),
              eq(savedPlaylists.userId, ctx.user.id)
            )
          );

        return results[0] || null;
      }),

    // Update last run timestamp
    updateLastRun: protectedProcedure
      .input(z.object({
        id: z.number(),
        videoCount: z.number().optional(),
        commentCount: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(savedPlaylists).set({
          lastRunAt: new Date(),
          lastVideoCount: input.videoCount,
          lastCommentCount: input.commentCount,
        }).where(eq(savedPlaylists.id, input.id));

        return { success: true };
      }),

    // Delete a saved playlist
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Delete associated runs first
        await db.delete(playlistRuns).where(eq(playlistRuns.savedPlaylistId, input.id));
        // Delete associated videos
        await db.delete(playlistVideos).where(eq(playlistVideos.savedPlaylistId, input.id));
        // Delete the playlist
        await db.delete(savedPlaylists).where(eq(savedPlaylists.id, input.id));

        return { success: true };
      }),

    // Update playlist status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "archived"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(savedPlaylists).set({
          status: input.status,
        }).where(eq(savedPlaylists.id, input.id));

        return { success: true };
      }),

    // Update refresh schedule
    updateSchedule: protectedProcedure
      .input(z.object({
        id: z.number(),
        refreshSchedule: z.enum(["none", "daily", "weekly"]),
        refreshHour: z.number().min(0).max(23).optional(),
        refreshDayOfWeek: z.number().min(0).max(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Calculate next refresh time
        let nextRefreshAt: Date | null = null;
        if (input.refreshSchedule !== "none") {
          const now = new Date();
          const hour = input.refreshHour ?? 9;
          
          if (input.refreshSchedule === "daily") {
            // Set to next occurrence of the specified hour
            nextRefreshAt = new Date(now);
            nextRefreshAt.setHours(hour, 0, 0, 0);
            if (nextRefreshAt <= now) {
              nextRefreshAt.setDate(nextRefreshAt.getDate() + 1);
            }
          } else if (input.refreshSchedule === "weekly") {
            // Set to next occurrence of the specified day and hour
            const dayOfWeek = input.refreshDayOfWeek ?? 1; // Default Monday
            nextRefreshAt = new Date(now);
            nextRefreshAt.setHours(hour, 0, 0, 0);
            const currentDay = nextRefreshAt.getDay();
            const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;
            nextRefreshAt.setDate(nextRefreshAt.getDate() + daysUntilNext);
            if (daysUntilNext === 0 && nextRefreshAt <= now) {
              nextRefreshAt.setDate(nextRefreshAt.getDate() + 7);
            }
          }
        }

        await db.update(savedPlaylists).set({
          refreshSchedule: input.refreshSchedule,
          refreshHour: input.refreshHour ?? 9,
          refreshDayOfWeek: input.refreshDayOfWeek ?? 1,
          nextRefreshAt,
        }).where(eq(savedPlaylists.id, input.id));

        return { success: true, nextRefreshAt };
      }),

    // Get playlists due for refresh
    getDueForRefresh: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const now = new Date();
        return await db.select().from(savedPlaylists)
          .where(
            and(
              eq(savedPlaylists.userId, ctx.user.id),
              eq(savedPlaylists.status, "active"),
              sql`${savedPlaylists.refreshSchedule} != 'none'`,
              sql`${savedPlaylists.nextRefreshAt} <= ${now}`
            )
          );
      }),

    // Get all scheduled playlists
    getScheduled: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        return await db.select().from(savedPlaylists)
          .where(
            and(
              eq(savedPlaylists.userId, ctx.user.id),
              sql`${savedPlaylists.refreshSchedule} != 'none'`
            )
          )
          .orderBy(savedPlaylists.nextRefreshAt);
      }),

    // Update next refresh time after a run completes
    updateNextRefresh: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get current playlist
        const results = await db.select().from(savedPlaylists)
          .where(eq(savedPlaylists.id, input.id));
        
        if (!results[0]) throw new Error("Playlist not found");
        const playlist = results[0];

        if (playlist.refreshSchedule === "none") {
          return { success: true, nextRefreshAt: null };
        }

        // Calculate next refresh time
        const now = new Date();
        const hour = playlist.refreshHour ?? 9;
        let nextRefreshAt: Date;

        if (playlist.refreshSchedule === "daily") {
          nextRefreshAt = new Date(now);
          nextRefreshAt.setHours(hour, 0, 0, 0);
          nextRefreshAt.setDate(nextRefreshAt.getDate() + 1);
        } else {
          // Weekly
          const dayOfWeek = playlist.refreshDayOfWeek ?? 1;
          nextRefreshAt = new Date(now);
          nextRefreshAt.setHours(hour, 0, 0, 0);
          nextRefreshAt.setDate(nextRefreshAt.getDate() + 7);
          // Adjust to correct day of week
          const currentDay = nextRefreshAt.getDay();
          const daysUntilNext = (dayOfWeek - currentDay + 7) % 7;
          nextRefreshAt.setDate(nextRefreshAt.getDate() + daysUntilNext);
        }

        await db.update(savedPlaylists).set({
          nextRefreshAt,
        }).where(eq(savedPlaylists.id, input.id));

        return { success: true, nextRefreshAt };
      }),
  }),

  // Playlist Runs Router
  playlistRuns: router({
    // Create a new run
    create: protectedProcedure
      .input(z.object({
        savedPlaylistId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(playlistRuns).values({
          savedPlaylistId: input.savedPlaylistId,
          status: "running",
          startedAt: new Date(),
        });

        return { id: Number((result as any)[0]?.insertId || 0) };
      }),

    // Update run with results
    complete: protectedProcedure
      .input(z.object({
        id: z.number(),
        videosAnalyzed: z.number(),
        commentsCollected: z.number(),
        newVideos: z.number().default(0),
        newComments: z.number().default(0),
        status: z.enum(["completed", "failed"]).default("completed"),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(playlistRuns).set({
          videosAnalyzed: input.videosAnalyzed,
          commentsCollected: input.commentsCollected,
          newVideos: input.newVideos,
          newComments: input.newComments,
          status: input.status,
          errorMessage: input.errorMessage,
          completedAt: new Date(),
        }).where(eq(playlistRuns.id, input.id));

        return { success: true };
      }),

    // Get runs for a playlist
    listByPlaylist: protectedProcedure
      .input(z.object({ savedPlaylistId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];

        return await db.select().from(playlistRuns)
          .where(eq(playlistRuns.savedPlaylistId, input.savedPlaylistId))
          .orderBy(desc(playlistRuns.startedAt));
      }),

    // Get latest run for a playlist
    getLatest: protectedProcedure
      .input(z.object({ savedPlaylistId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;

        const results = await db.select().from(playlistRuns)
          .where(eq(playlistRuns.savedPlaylistId, input.savedPlaylistId))
          .orderBy(desc(playlistRuns.startedAt))
          .limit(1);

        return results[0] || null;
      }),
  }),

  // Playlist Videos Router
  playlistVideos: router({
    // Save videos for a playlist
    saveMany: protectedProcedure
      .input(z.object({
        savedPlaylistId: z.number(),
        videos: z.array(z.object({
          videoYoutubeId: z.string(),
          videoTitle: z.string().optional(),
          thumbnailUrl: z.string().optional(),
          viewCount: z.number().default(0),
          likeCount: z.number().default(0),
          commentCount: z.number().default(0),
          publishedAt: z.date().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let newCount = 0;
        for (const video of input.videos) {
          // Check if video already exists for this playlist
          const existing = await db.select().from(playlistVideos).where(
            and(
              eq(playlistVideos.savedPlaylistId, input.savedPlaylistId),
              eq(playlistVideos.videoYoutubeId, video.videoYoutubeId)
            )
          );

          if (existing.length === 0) {
            await db.insert(playlistVideos).values({
              savedPlaylistId: input.savedPlaylistId,
              videoYoutubeId: video.videoYoutubeId,
              videoTitle: video.videoTitle,
              thumbnailUrl: video.thumbnailUrl,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
              publishedAt: video.publishedAt,
            });
            newCount++;
          } else {
            // Update existing video stats
            await db.update(playlistVideos).set({
              videoTitle: video.videoTitle,
              thumbnailUrl: video.thumbnailUrl,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
            }).where(eq(playlistVideos.id, existing[0].id));
          }
        }

        return { savedCount: input.videos.length, newCount };
      }),

    // Get videos for a playlist
    listByPlaylist: protectedProcedure
      .input(z.object({ savedPlaylistId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];

        return await db.select().from(playlistVideos)
          .where(eq(playlistVideos.savedPlaylistId, input.savedPlaylistId))
          .orderBy(desc(playlistVideos.firstSeenAt));
      }),

    // Update last comment fetch time
    updateCommentFetch: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.update(playlistVideos).set({
          lastCommentFetchAt: new Date(),
        }).where(eq(playlistVideos.id, input.id));

        return { success: true };
      }),
  }),

  // TikTok Intelligence Router
  tiktok: router({
    parseUrl: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(({ input }) => {
        return parseTikTokUrl(input.url);
      }),

    getVideo: publicProcedure
      .input(z.object({
        videoId: z.string(),
        creatorId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        
        // Check if video exists in database
        if (db) {
          const existing = await db.select().from(tiktokVideos).where(eq(tiktokVideos.videoId, input.videoId)).limit(1);
          if (existing.length > 0) {
            // Get creator info
            let creator = null;
            if (existing[0].creatorUniqueId) {
              const creatorResult = await db.select().from(tiktokCreators).where(eq(tiktokCreators.uniqueId, existing[0].creatorUniqueId)).limit(1);
              creator = creatorResult[0] || generateSampleCreator(existing[0].creatorUniqueId);
            }
            return { ...existing[0], creator };
          }
        }

        // Generate sample data
        const video = generateSampleVideo(input.videoId, input.creatorId);
        
        // Store in database
        if (db) {
          // Store creator first
          await db.insert(tiktokCreators).values({
            uniqueId: video.creator.uniqueId,
            nickname: video.creator.nickname,
            avatarUrl: video.creator.avatarUrl,
            signature: video.creator.signature,
            verified: video.creator.verified,
            followerCount: video.creator.followerCount,
            followingCount: video.creator.followingCount,
            heartCount: video.creator.heartCount,
            videoCount: video.creator.videoCount,
          }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

          // Store video
          await db.insert(tiktokVideos).values({
            videoId: video.videoId,
            creatorUniqueId: video.creator.uniqueId,
            description: video.description,
            coverUrl: video.coverUrl,
            duration: video.duration,
            playCount: video.playCount,
            diggCount: video.diggCount,
            shareCount: video.shareCount,
            commentCount: video.commentCount,
            collectCount: video.collectCount,
            musicId: video.musicId,
            musicTitle: video.musicTitle,
            musicAuthor: video.musicAuthor,
            hashtags: video.hashtags,
            createTime: video.createTime,
          }).onDuplicateKeyUpdate({ set: { fetchedAt: new Date() } });
        }

        return video;
      }),

    getComments: publicProcedure
      .input(z.object({
        videoId: z.string(),
        count: z.number().default(20),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        
        // Check if comments exist in database
        if (db) {
          const existing = await db.select().from(tiktokComments).where(eq(tiktokComments.videoId, input.videoId)).limit(input.count);
          if (existing.length > 0) {
            return {
              comments: existing,
              stats: {
                total: existing.length,
                positive: existing.filter(c => c.sentiment === 'positive').length,
                negative: existing.filter(c => c.sentiment === 'negative').length,
                neutral: existing.filter(c => c.sentiment === 'neutral').length,
              },
            };
          }
        }

        // Generate sample comments
        const comments = generateSampleTikTokComments(input.videoId, input.count);
        
        // Analyze sentiment and store
        const analyzedComments = comments.map(comment => {
          const { sentiment, score } = analyzeTikTokSentiment(comment.text);
          return { ...comment, sentiment, sentimentScore: score };
        });

        // Store in database
        if (db) {
          for (const comment of analyzedComments) {
            await db.insert(tiktokComments).values({
              commentId: comment.commentId,
              videoId: comment.videoId,
              authorUniqueId: comment.authorUniqueId,
              authorNickname: comment.authorNickname,
              authorAvatarUrl: comment.authorAvatarUrl,
              text: comment.text,
              diggCount: comment.diggCount,
              replyCount: comment.replyCount,
              sentiment: comment.sentiment as any,
              sentimentScore: String(comment.sentimentScore),
              createTime: comment.createTime,
            }).onDuplicateKeyUpdate({ set: { fetchedAt: new Date() } });
          }
        }

        return {
          comments: analyzedComments,
          stats: {
            total: analyzedComments.length,
            positive: analyzedComments.filter(c => c.sentiment === 'positive').length,
            negative: analyzedComments.filter(c => c.sentiment === 'negative').length,
            neutral: analyzedComments.filter(c => c.sentiment === 'neutral').length,
          },
        };
      }),

    getCreator: publicProcedure
      .input(z.object({ uniqueId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        
        if (db) {
          const existing = await db.select().from(tiktokCreators).where(eq(tiktokCreators.uniqueId, input.uniqueId)).limit(1);
          if (existing.length > 0) {
            return existing[0];
          }
        }

        return generateSampleCreator(input.uniqueId);
      }),

    getTrendingHashtags: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const db = await getDb();
        
        if (db) {
          const videos = await db.select().from(tiktokVideos).limit(100);
          const videoInfos: TikTokVideoInfo[] = videos.map(v => ({
            ...v,
            hashtags: (v.hashtags as string[]) || [],
            creator: generateSampleCreator(v.creatorUniqueId || 'unknown'),
          })) as any;
          return extractTrendingHashtags(videoInfos).slice(0, input.limit);
        }

        // Return sample trending hashtags
        return [
          { hashtag: 'fyp', count: 150, totalViews: 50000000 },
          { hashtag: 'viral', count: 120, totalViews: 45000000 },
          { hashtag: 'trending', count: 100, totalViews: 40000000 },
          { hashtag: 'tech', count: 80, totalViews: 30000000 },
          { hashtag: 'review', count: 70, totalViews: 25000000 },
        ].slice(0, input.limit);
      }),
  }),

  // Saved Comments Router (for quick copy/highlight/save feature)
  savedComments: router({
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const results = await db.select().from(savedComments)
          .where(eq(savedComments.userId, ctx.user.id))
          .orderBy(desc(savedComments.savedAt));
        
        return results;
      }),

    updateNotes: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(savedComments).set({ notes: input.notes }).where(
          and(
            eq(savedComments.id, input.id),
            eq(savedComments.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    bulkDelete: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        for (const id of input.ids) {
          await db.delete(savedComments).where(
            and(
              eq(savedComments.id, id),
              eq(savedComments.userId, ctx.user.id)
            )
          );
        }

        return { success: true, deleted: input.ids.length };
      }),

    save: protectedProcedure
      .input(z.object({
        sourceType: z.enum(['youtube', 'amazon', 'reddit', 'tiktok']),
        sourceId: z.string(),
        commentId: z.string(),
        authorName: z.string().optional(),
        text: z.string(),
        highlighted: z.boolean().default(false),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        collectionName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const result = await db.insert(savedComments).values({
          userId: ctx.user.id,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          commentId: input.commentId,
          authorName: input.authorName,
          text: input.text,
          highlighted: input.highlighted,
          notes: input.notes,
          tags: input.tags,
          collectionName: input.collectionName,
        });

        return { id: result[0].insertId, success: true };
      }),

    list: protectedProcedure
      .input(z.object({
        sourceType: z.enum(['youtube', 'amazon', 'reddit', 'tiktok']).optional(),
        collectionName: z.string().optional(),
        highlightedOnly: z.boolean().default(false),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let query = db.select().from(savedComments).where(eq(savedComments.userId, ctx.user.id));
        
        // Note: Additional filtering would be done in application code
        // due to drizzle query builder limitations
        const results = await query.orderBy(desc(savedComments.savedAt));
        
        return results.filter(c => {
          if (input.sourceType && c.sourceType !== input.sourceType) return false;
          if (input.collectionName && c.collectionName !== input.collectionName) return false;
          if (input.highlightedOnly && !c.highlighted) return false;
          return true;
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        highlighted: z.boolean().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        collectionName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const updateData: any = {};
        if (input.highlighted !== undefined) updateData.highlighted = input.highlighted;
        if (input.notes !== undefined) updateData.notes = input.notes;
        if (input.tags !== undefined) updateData.tags = input.tags;
        if (input.collectionName !== undefined) updateData.collectionName = input.collectionName;

        await db.update(savedComments).set(updateData).where(
          and(
            eq(savedComments.id, input.id),
            eq(savedComments.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(savedComments).where(
          and(
            eq(savedComments.id, input.id),
            eq(savedComments.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    getCollections: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const results = await db.select({ collectionName: savedComments.collectionName })
          .from(savedComments)
          .where(eq(savedComments.userId, ctx.user.id));
        
        const collectionSet = new Set(results.map(r => r.collectionName).filter(Boolean));
        const collections = Array.from(collectionSet);
        return collections as string[];
      }),
  }),

  // Comment Collections Router
  collections: router({
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const results = await db.select().from(commentCollections)
          .where(eq(commentCollections.userId, ctx.user.id))
          .orderBy(desc(commentCollections.createdAt));
        
        return results;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const result = await db.insert(commentCollections).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color || "#6366f1",
          icon: input.icon || "folder",
        });

        return { success: true, id: Number(result[0].insertId) };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.color !== undefined) updateData.color = input.color;
        if (input.icon !== undefined) updateData.icon = input.icon;

        await db.update(commentCollections).set(updateData).where(
          and(
            eq(commentCollections.id, input.id),
            eq(commentCollections.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // First, get the collection name
        const collection = await db.select().from(commentCollections)
          .where(and(
            eq(commentCollections.id, input.id),
            eq(commentCollections.userId, ctx.user.id)
          ));

        if (collection.length > 0) {
          // Remove collection reference from saved comments
          await db.update(savedComments)
            .set({ collectionName: null })
            .where(and(
              eq(savedComments.userId, ctx.user.id),
              eq(savedComments.collectionName, collection[0].name)
            ));

          // Delete the collection
          await db.delete(commentCollections).where(
            and(
              eq(commentCollections.id, input.id),
              eq(commentCollections.userId, ctx.user.id)
            )
          );
        }

        return { success: true };
      }),

    addComment: protectedProcedure
      .input(z.object({
        collectionId: z.number(),
        commentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get collection name
        const collection = await db.select().from(commentCollections)
          .where(and(
            eq(commentCollections.id, input.collectionId),
            eq(commentCollections.userId, ctx.user.id)
          ));

        if (collection.length === 0) throw new Error("Collection not found");

        // Update comment with collection name
        await db.update(savedComments)
          .set({ collectionName: collection[0].name })
          .where(and(
            eq(savedComments.id, input.commentId),
            eq(savedComments.userId, ctx.user.id)
          ));

        // Update collection comment count
        await db.update(commentCollections)
          .set({ 
            commentCount: sql`${commentCollections.commentCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(commentCollections.id, input.collectionId));

        return { success: true };
      }),

    removeComment: protectedProcedure
      .input(z.object({
        collectionId: z.number(),
        commentId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Remove collection reference from comment
        await db.update(savedComments)
          .set({ collectionName: null })
          .where(and(
            eq(savedComments.id, input.commentId),
            eq(savedComments.userId, ctx.user.id)
          ));

        // Update collection comment count
        await db.update(commentCollections)
          .set({ 
            commentCount: sql`GREATEST(${commentCollections.commentCount} - 1, 0)`,
            updatedAt: new Date()
          })
          .where(eq(commentCollections.id, input.collectionId));

        return { success: true };
      }),

    // Reorder comments within collection
    reorderComments: protectedProcedure
      .input(z.object({
        collectionName: z.string(),
        commentIds: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Update sort order for each comment
        for (let i = 0; i < input.commentIds.length; i++) {
          await db.update(savedComments)
            .set({ sortOrder: i })
            .where(and(
              eq(savedComments.id, input.commentIds[i]),
              eq(savedComments.userId, ctx.user.id)
            ));
        }

        return { success: true };
      }),

    // Generate share link for collection
    generateShareLink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Generate unique token
        const shareToken = `col_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

        await db.update(commentCollections)
          .set({ 
            isPublic: true, 
            shareToken,
            updatedAt: new Date()
          })
          .where(and(
            eq(commentCollections.id, input.id),
            eq(commentCollections.userId, ctx.user.id)
          ));

        return { shareToken };
      }),

    // Revoke share access
    revokeShare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(commentCollections)
          .set({ 
            isPublic: false, 
            shareToken: null,
            updatedAt: new Date()
          })
          .where(and(
            eq(commentCollections.id, input.id),
            eq(commentCollections.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Get public collection by share token (no auth required)
    getPublicCollection: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const collections = await db.select().from(commentCollections)
          .where(and(
            eq(commentCollections.shareToken, input.shareToken),
            eq(commentCollections.isPublic, true)
          ));

        if (collections.length === 0) return null;

        const collection = collections[0];

        // Get comments in this collection
        const comments = await db.select().from(savedComments)
          .where(and(
            eq(savedComments.userId, collection.userId),
            eq(savedComments.collectionName, collection.name)
          ))
          .orderBy(savedComments.sortOrder);

        return {
          collection: {
            name: collection.name,
            description: collection.description,
            color: collection.color,
            commentCount: collection.commentCount,
          },
          comments: comments.map(c => ({
            id: c.id,
            sourceType: c.sourceType,
            authorName: c.authorName,
            text: c.text,
            savedAt: c.savedAt,
          })),
        };
      }),
  }),

  // NLP Analysis Router
  nlpAnalysis: router({
    analyzeComments: protectedProcedure
      .input(z.object({
        comments: z.array(z.object({
          id: z.string(),
          text: z.string(),
          authorName: z.string().optional(),
        })),
        sourceType: z.enum(["youtube", "amazon", "reddit", "tiktok", "mixed"]),
        sourceId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!ctx.user) throw new Error("Not authenticated");

        // Advanced sentiment analysis
        const positiveWords = ["love", "great", "amazing", "awesome", "excellent", "fantastic", "wonderful", "best", "perfect", "helpful", "thank", "thanks", "good", "nice", "beautiful", "brilliant", "incredible", "outstanding", "superb", "recommend", "impressed", "enjoy", "favorite", "useful", "valuable"];
        const negativeWords = ["hate", "bad", "terrible", "awful", "worst", "horrible", "poor", "disappointing", "waste", "boring", "annoying", "useless", "trash", "garbage", "sucks", "stupid", "dumb", "scam", "fake", "wrong", "broken", "frustrating", "confusing", "overpriced", "misleading"];
        const mixedIndicators = ["but", "however", "although", "though", "except", "despite"];

        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;
        let mixedCount = 0;

        // Analyze each comment
        input.comments.forEach(comment => {
          const lower = comment.text.toLowerCase();
          let posScore = 0;
          let negScore = 0;
          let hasMixed = mixedIndicators.some(w => lower.includes(w));

          positiveWords.forEach(w => { if (lower.includes(w)) posScore++; });
          negativeWords.forEach(w => { if (lower.includes(w)) negScore++; });

          if (hasMixed && posScore > 0 && negScore > 0) {
            mixedCount++;
          } else if (posScore > negScore) {
            positiveCount++;
          } else if (negScore > posScore) {
            negativeCount++;
          } else {
            neutralCount++;
          }
        });

        // Extract topics using TF-IDF-like approach
        const allText = input.comments.map(c => c.text).join(" ");
        const words = allText.toLowerCase().split(/\W+/).filter(w => w.length > 4);
        const stopWords = new Set(["about", "after", "again", "being", "could", "every", "first", "found", "going", "great", "having", "their", "there", "these", "thing", "think", "those", "video", "watch", "where", "which", "while", "would", "really", "should", "still", "thank", "thanks", "through", "using", "youre", "yours"]);
        const wordFreq: Record<string, number> = {};
        words.forEach(w => {
          if (!stopWords.has(w)) {
            wordFreq[w] = (wordFreq[w] || 0) + 1;
          }
        });

        const topTopics = Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([word, count]) => ({
            topic: word,
            score: count / words.length,
            keywords: [word]
          }));

        // Extract key themes
        const themes: string[] = [];
        const total = input.comments.length;
        if (positiveCount > total * 0.6) themes.push("Overwhelmingly positive reception");
        else if (positiveCount > total * 0.4) themes.push("Generally positive feedback");
        if (negativeCount > total * 0.3) themes.push("Significant criticism present");
        if (mixedCount > total * 0.2) themes.push("Mixed opinions common");

        const questions = input.comments.filter(c => c.text.includes("?"));
        if (questions.length > 5) themes.push(`${questions.length} questions from audience`);

        // Extract pain points from negative comments
        const painPoints: { text: string; frequency: number }[] = [];
        input.comments
          .filter(c => {
            const lower = c.text.toLowerCase();
            return negativeWords.some(w => lower.includes(w));
          })
          .slice(0, 10)
          .forEach(c => {
            painPoints.push({ text: c.text.substring(0, 150), frequency: 1 });
          });

        // Extract suggestions
        const suggestionPatterns = ["should", "could", "would be nice", "please", "wish", "hope", "suggest", "recommend"];
        const suggestions: { text: string; frequency: number }[] = [];
        input.comments.forEach(c => {
          const lower = c.text.toLowerCase();
          if (suggestionPatterns.some(p => lower.includes(p)) && suggestions.length < 10) {
            suggestions.push({ text: c.text.substring(0, 150), frequency: 1 });
          }
        });

        // Extract questions
        const extractedQuestions = questions.slice(0, 10).map(q => q.text.substring(0, 150));

        // Extract named entities (simple pattern matching)
        const namedEntities: { entity: string; type: string; count: number }[] = [];
        const productPatterns = /\b(iphone|android|samsung|apple|google|amazon|microsoft|netflix|spotify|youtube|instagram|tiktok|facebook|twitter)\b/gi;
        const entityCounts: Record<string, number> = {};
        input.comments.forEach(c => {
          const matches = c.text.match(productPatterns);
          if (matches) {
            matches.forEach(m => {
              const normalized = m.toLowerCase();
              entityCounts[normalized] = (entityCounts[normalized] || 0) + 1;
            });
          }
        });
        Object.entries(entityCounts).forEach(([entity, count]) => {
          namedEntities.push({ entity, type: "brand", count });
        });

        // Generate summary
        const summary = `Analysis of ${input.comments.length} comments shows ${Math.round(positiveCount/total*100)}% positive, ${Math.round(negativeCount/total*100)}% negative, and ${Math.round(neutralCount/total*100)}% neutral sentiment. Top topics include: ${topTopics.slice(0, 5).map(t => t.topic).join(", ")}. ${themes.join(". ")}.`;

        // Save to database if available
        if (db) {
          await db.insert(nlpAnalysisResults).values({
            userId: ctx.user.id,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
            topics: topTopics,
            sentimentBreakdown: { positive: positiveCount, negative: negativeCount, neutral: neutralCount, mixed: mixedCount },
            keyThemes: themes,
            painPoints,
            suggestions,
            questions: extractedQuestions,
            namedEntities,
            summary,
            commentCount: input.comments.length,
          });
        }

        return {
          topics: topTopics,
          sentimentBreakdown: { positive: positiveCount, negative: negativeCount, neutral: neutralCount, mixed: mixedCount },
          keyThemes: themes,
          painPoints,
          suggestions,
          questions: extractedQuestions,
          namedEntities,
          summary,
          commentCount: input.comments.length,
        };
      }),

    getHistory: protectedProcedure
      .input(z.object({
        sourceType: z.enum(["youtube", "amazon", "reddit", "tiktok", "mixed"]).optional(),
        limit: z.number().min(1).max(50).default(10),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let query = db.select().from(nlpAnalysisResults)
          .where(eq(nlpAnalysisResults.userId, ctx.user.id));

        if (input.sourceType) {
          query = db.select().from(nlpAnalysisResults)
            .where(and(
              eq(nlpAnalysisResults.userId, ctx.user.id),
              eq(nlpAnalysisResults.sourceType, input.sourceType)
            ));
        }

        const results = await query
          .orderBy(desc(nlpAnalysisResults.analyzedAt))
          .limit(input.limit);

        return results;
      }),
  }),

  // Content Generator Router - AI-powered content creation tools
  contentGenerator: router({
    // Get all available content types
    getContentTypes: publicProcedure
      .query(() => {
        return [
          { id: "advertorial", name: "Advertorial", description: "Story-driven native ads that convert", icon: "FileText" },
          { id: "vsl_script", name: "VSL Script", description: "Video sales letter scripts", icon: "Video" },
          { id: "ugc_scenario", name: "UGC Scenario", description: "Authentic user-generated content scripts", icon: "Users" },
          { id: "course_outline", name: "Course Outline", description: "Comprehensive course structures", icon: "BookOpen" },
          { id: "ad_copy", name: "Ad Copy", description: "High-converting ad variations", icon: "Megaphone" },
          { id: "sales_page", name: "Sales Page", description: "Long-form sales page copy", icon: "ShoppingCart" },
          { id: "email_sequence", name: "Email Sequence", description: "Nurture and sales email sequences", icon: "Mail" },
          { id: "product_idea", name: "Product Ideas", description: "Product ideation from research", icon: "Lightbulb" },
        ];
      }),

    // Get prompts for a specific content type
    getPrompts: publicProcedure
      .input(z.object({ contentType: z.string() }))
      .query(({ input }) => {
        return getPromptsForType(input.contentType);
      }),

    // Get a specific prompt by ID
    getPromptById: publicProcedure
      .input(z.object({ promptId: z.string() }))
      .query(({ input }) => {
        return getPromptById(input.promptId);
      }),

    // Get copywriting frameworks
    getFrameworks: publicProcedure
      .query(() => {
        return frameworksData;
      }),

    // Get CRO best practices
    getCroPractices: publicProcedure
      .input(z.object({ contentType: z.string().optional() }))
      .query(({ input }) => {
        if (input.contentType) {
          return croPracticesData.filter(p => p.contentType === input.contentType || p.contentType === "all");
        }
        return croPracticesData;
      }),

    // Generate content using AI
    generate: protectedProcedure
      .input(z.object({
        contentType: z.enum(["advertorial", "vsl_script", "ugc_scenario", "course_outline", "ad_copy", "sales_page", "email_sequence", "product_idea"]),
        promptId: z.string(),
        variables: z.record(z.string(), z.string()),
        sourceComments: z.array(z.object({
          id: z.string(),
          text: z.string(),
          source: z.string(),
          category: z.string().optional(),
        })).optional(),
        framework: z.string().optional(),
        tone: z.string().optional(),
        targetAudience: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!ctx.user) throw new Error("Not authenticated");

        // Get the prompt template
        const prompt = getPromptById(input.promptId);
        if (!prompt) throw new Error("Prompt not found");

        // Build the prompt with variables
        let finalPrompt = prompt.promptTemplate;
        for (const [key, value] of Object.entries(input.variables)) {
          finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        // Add source comments if provided
        if (input.sourceComments && input.sourceComments.length > 0) {
          const commentsText = input.sourceComments.map(c => 
            `- "${c.text}" (Source: ${c.source}${c.category ? `, Category: ${c.category}` : ''})`
          ).join('\n');
          finalPrompt = finalPrompt.replace(/{{pain_points}}/g, commentsText);
          finalPrompt = finalPrompt.replace(/{{testimonials}}/g, commentsText);
          finalPrompt = finalPrompt.replace(/{{customer_comments}}/g, commentsText);
          finalPrompt = finalPrompt.replace(/{{wish_comments}}/g, commentsText);
          finalPrompt = finalPrompt.replace(/{{product_requests}}/g, commentsText);
        }

        // Call LLM to generate content
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert copywriter and content strategist. Generate high-quality, conversion-focused content based on the provided prompt and research data." },
            { role: "user", content: finalPrompt },
          ],
        });

        const rawGeneratedContent = response.choices[0]?.message?.content;
        const generatedContent = typeof rawGeneratedContent === 'string' ? rawGeneratedContent : '';
        const wordCount = generatedContent.split(/\s+/).length;

        // Save to database
        let savedId: number | null = null;
        if (db) {
          const result = await db.insert(contentTemplates).values({
            userId: ctx.user.id,
            contentType: input.contentType,
            title: `${prompt.name} - ${new Date().toLocaleDateString()}`,
            content: generatedContent,
            sourceComments: input.sourceComments,
            sourceInsights: {
              painPoints: [],
              desires: [],
              objections: [],
              testimonials: [],
            },
            promptUsed: finalPrompt,
            frameworkUsed: input.framework || prompt.framework,
            tone: input.tone,
            targetAudience: input.targetAudience,
            wordCount,
          });
          savedId = Number(result[0].insertId);
        }

        return {
          id: savedId,
          content: generatedContent,
          wordCount,
          promptUsed: prompt.name,
          framework: input.framework || prompt.framework,
        };
      }),

    // Get user's generated content history
    getHistory: protectedProcedure
      .input(z.object({
        contentType: z.enum(["advertorial", "vsl_script", "ugc_scenario", "course_outline", "ad_copy", "sales_page", "email_sequence", "product_idea"]).optional(),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let query = db.select().from(contentTemplates)
          .where(eq(contentTemplates.userId, ctx.user.id));

        if (input.contentType) {
          query = db.select().from(contentTemplates)
            .where(and(
              eq(contentTemplates.userId, ctx.user.id),
              eq(contentTemplates.contentType, input.contentType)
            ));
        }

        const results = await query
          .orderBy(desc(contentTemplates.createdAt))
          .limit(input.limit);

        return results;
      }),

    // Get a specific generated content
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const results = await db.select().from(contentTemplates)
          .where(and(
            eq(contentTemplates.id, input.id),
            eq(contentTemplates.userId, ctx.user.id)
          ));

        return results[0] || null;
      }),

    // Update generated content
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        isFavorite: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.content !== undefined) {
          updateData.content = input.content;
          updateData.wordCount = input.content.split(/\s+/).length;
        }
        if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

        await db.update(contentTemplates).set(updateData).where(
          and(
            eq(contentTemplates.id, input.id),
            eq(contentTemplates.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    // Delete generated content
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(contentTemplates).where(
          and(
            eq(contentTemplates.id, input.id),
            eq(contentTemplates.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    // Get saved comments for content generation
    getSavedCommentsForGeneration: protectedProcedure
      .input(z.object({
        sourceType: z.enum(["youtube", "amazon", "reddit", "tiktok"]).optional(),
        collectionName: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const results = await db.select().from(savedComments)
          .where(eq(savedComments.userId, ctx.user.id))
          .orderBy(desc(savedComments.savedAt))
          .limit(input.limit);

        return results.filter(c => {
          if (input.sourceType && c.sourceType !== input.sourceType) return false;
          if (input.collectionName && c.collectionName !== input.collectionName) return false;
          return true;
        }).map(c => ({
          id: String(c.id),
          text: c.text,
          source: c.sourceType,
          authorName: c.authorName,
          category: (c.tags as string[] | null)?.[0] || undefined,
        }));
      }),

    // Categorize comments for content generation
    categorizeComments: protectedProcedure
      .input(z.object({
        comments: z.array(z.object({
          id: z.string(),
          text: z.string(),
          source: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");

        // Use LLM to categorize comments
        const commentsText = input.comments.map((c, i) => `${i + 1}. "${c.text}"`).join('\n');
        
        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `You are a marketing research analyst. Categorize each comment into one of these categories:
- pain_point: Expresses frustration, problem, or struggle
- testimonial: Shares positive experience or result
- product_request: Asks for or suggests a product/feature
- question: Asks a question about the topic
- objection: Expresses doubt, concern, or resistance
- desire: Expresses a want, wish, or aspiration
- other: Doesn't fit other categories

Respond with JSON array of objects with "id" and "category" fields.` 
            },
            { role: "user", content: `Categorize these comments:\n${commentsText}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "categorized_comments",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        category: { type: "string" },
                      },
                      required: ["id", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["categories"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : '{"categories":[]}';
        const parsed = JSON.parse(content);
        
        // Map back to original comments
        return input.comments.map((comment, index) => {
          const categorized = parsed.categories?.find((c: any) => c.id === String(index + 1));
          return {
            ...comment,
            category: categorized?.category || "other",
          };
        });
      }),

    // Extract insights from comments for content generation
    extractInsights: protectedProcedure
      .input(z.object({
        comments: z.array(z.object({
          id: z.string(),
          text: z.string(),
          source: z.string(),
          category: z.string().optional(),
        })),
        targetProduct: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");

        const commentsText = input.comments.map(c => 
          `[${c.category || 'uncategorized'}] "${c.text}"`
        ).join('\n');

        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `You are a marketing research analyst. Extract actionable insights from customer comments for content creation. Focus on:
1. Pain points - specific problems and frustrations
2. Desires - what they want to achieve
3. Objections - concerns about solutions
4. Testimonial themes - what success looks like
5. Language patterns - exact phrases they use

Provide insights that can be directly used in marketing copy.` 
            },
            { 
              role: "user", 
              content: `Extract marketing insights from these ${input.comments.length} comments${input.targetProduct ? ` for ${input.targetProduct}` : ''}:\n\n${commentsText}` 
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "extracted_insights",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  painPoints: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific pain points and problems",
                  },
                  desires: {
                    type: "array",
                    items: { type: "string" },
                    description: "What they want to achieve",
                  },
                  objections: {
                    type: "array",
                    items: { type: "string" },
                    description: "Concerns and objections",
                  },
                  testimonialThemes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Success themes from positive comments",
                  },
                  keyPhrases: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exact phrases to use in copy",
                  },
                  targetAudienceProfile: {
                    type: "string",
                    description: "Summary of who these people are",
                  },
                },
                required: ["painPoints", "desires", "objections", "testimonialThemes", "keyPhrases", "targetAudienceProfile"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent2 = response.choices[0]?.message?.content;
        const content2 = typeof rawContent2 === 'string' ? rawContent2 : '{}';
        return JSON.parse(content2);
      }),

    // ============ SAVED TEMPLATES ============

    // Save content as a reusable template
    saveAsTemplate: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        contentType: z.enum(["advertorial", "vsl_script", "ugc_scenario", "course_outline", "ad_copy", "sales_page", "email_sequence", "product_idea"]),
        templateContent: z.string().min(1),
        variables: z.array(z.object({
          name: z.string(),
          description: z.string(),
          defaultValue: z.string().optional(),
          required: z.boolean(),
        })).optional(),
        frameworkUsed: z.string().optional(),
        tone: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Auto-extract variables from {{variable}} patterns if not provided
        let variables = input.variables;
        if (!variables || variables.length === 0) {
          const matches = input.templateContent.match(/\{\{([^}]+)\}\}/g) || [];
          const uniqueVars = Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim())));
          variables = uniqueVars.map(v => ({
            name: v,
            description: `Value for ${v}`,
            required: true,
          }));
        }

        const result = await db.insert(savedTemplates).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
          contentType: input.contentType,
          templateContent: input.templateContent,
          variables: variables,
          frameworkUsed: input.frameworkUsed || null,
          tone: input.tone || null,
          category: input.category || null,
          tags: input.tags || null,
          useCount: 0,
          isPublic: false,
          isFavorite: false,
        });

        return { success: true, id: result[0].insertId };
      }),

    // Get all saved templates
    getTemplates: protectedProcedure
      .input(z.object({
        contentType: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let query = db.select().from(savedTemplates)
          .where(eq(savedTemplates.userId, ctx.user.id));

        const results = await query
          .orderBy(desc(savedTemplates.updatedAt))
          .limit(input.limit);

        // Filter in memory for optional params
        return results.filter(t => {
          if (input.contentType && t.contentType !== input.contentType) return false;
          if (input.category && t.category !== input.category) return false;
          if (input.search) {
            const searchLower = input.search.toLowerCase();
            if (!t.name.toLowerCase().includes(searchLower) && 
                !(t.description?.toLowerCase().includes(searchLower))) return false;
          }
          return true;
        });
      }),

    // Get a specific template
    getTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const results = await db.select().from(savedTemplates)
          .where(and(
            eq(savedTemplates.id, input.id),
            eq(savedTemplates.userId, ctx.user.id)
          ));

        return results[0] || null;
      }),

    // Use a template (increment use count and return with variables)
    useTemplate: protectedProcedure
      .input(z.object({
        id: z.number(),
        variableValues: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get the template
        const templates = await db.select().from(savedTemplates)
          .where(and(
            eq(savedTemplates.id, input.id),
            eq(savedTemplates.userId, ctx.user.id)
          ));

        if (!templates[0]) throw new Error("Template not found");
        const template = templates[0];

        // Update use count
        await db.update(savedTemplates).set({
          useCount: (template.useCount || 0) + 1,
          lastUsedAt: new Date(),
        }).where(eq(savedTemplates.id, input.id));

        // Replace variables in content
        let content = template.templateContent;
        if (input.variableValues) {
          for (const [key, value] of Object.entries(input.variableValues)) {
            content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
          }
        }

        return {
          ...template,
          processedContent: content,
        };
      }),

    // Update a template
    updateTemplate: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        templateContent: z.string().optional(),
        variables: z.array(z.object({
          name: z.string(),
          description: z.string(),
          defaultValue: z.string().optional(),
          required: z.boolean(),
        })).optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isFavorite: z.boolean().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.templateContent !== undefined) updateData.templateContent = input.templateContent;
        if (input.variables !== undefined) updateData.variables = input.variables;
        if (input.category !== undefined) updateData.category = input.category;
        if (input.tags !== undefined) updateData.tags = input.tags;
        if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
        if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

        await db.update(savedTemplates).set(updateData).where(
          and(
            eq(savedTemplates.id, input.id),
            eq(savedTemplates.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    // Delete a template
    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(savedTemplates).where(
          and(
            eq(savedTemplates.id, input.id),
            eq(savedTemplates.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    // ============ CONTENT VERSIONING ============

    // Create a new version of content
    createVersion: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number(),
        versionName: z.string().optional(),
        content: z.string(),
        changeNotes: z.string().optional(),
        changeSummary: z.string().optional(),
        isAbTest: z.boolean().optional(),
        abTestName: z.string().optional(),
        abTestVariant: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get the latest version number
        const existingVersions = await db.select().from(contentVersions)
          .where(eq(contentVersions.contentTemplateId, input.contentTemplateId))
          .orderBy(desc(contentVersions.versionNumber))
          .limit(1);

        const nextVersion = (existingVersions[0]?.versionNumber || 0) + 1;

        const result = await db.insert(contentVersions).values({
          contentTemplateId: input.contentTemplateId,
          userId: ctx.user.id,
          versionNumber: nextVersion,
          versionName: input.versionName || `Version ${nextVersion}`,
          content: input.content,
          changeNotes: input.changeNotes || null,
          changeSummary: input.changeSummary || null,
          isAbTest: input.isAbTest || false,
          abTestName: input.abTestName || null,
          abTestVariant: input.abTestVariant || null,
          status: "draft",
          metrics: null,
          annotations: null,
        });

        return { success: true, id: result[0].insertId, versionNumber: nextVersion };
      }),

    // Get all versions for a content template
    getVersions: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const results = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.contentTemplateId, input.contentTemplateId),
            eq(contentVersions.userId, ctx.user.id)
          ))
          .orderBy(desc(contentVersions.versionNumber));

        return results;
      }),

    // Get a specific version
    getVersion: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const results = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.id, input.id),
            eq(contentVersions.userId, ctx.user.id)
          ));

        return results[0] || null;
      }),

    // Update version metrics (for A/B testing)
    updateVersionMetrics: protectedProcedure
      .input(z.object({
        id: z.number(),
        metrics: z.object({
          impressions: z.number().optional(),
          clicks: z.number().optional(),
          conversions: z.number().optional(),
          ctr: z.number().optional(),
          conversionRate: z.number().optional(),
          revenue: z.number().optional(),
          engagement: z.number().optional(),
          customMetrics: z.record(z.string(), z.number()).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get existing metrics
        const versions = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.id, input.id),
            eq(contentVersions.userId, ctx.user.id)
          ));

        if (!versions[0]) throw new Error("Version not found");

        // Merge metrics
        const existingMetrics = versions[0].metrics || {};
        const newMetrics = { ...existingMetrics, ...input.metrics };

        // Calculate CTR and conversion rate if we have the data
        if (newMetrics.impressions && newMetrics.clicks) {
          newMetrics.ctr = (newMetrics.clicks / newMetrics.impressions) * 100;
        }
        if (newMetrics.clicks && newMetrics.conversions) {
          newMetrics.conversionRate = (newMetrics.conversions / newMetrics.clicks) * 100;
        }

        await db.update(contentVersions).set({
          metrics: newMetrics,
        }).where(eq(contentVersions.id, input.id));

        return { success: true, metrics: newMetrics };
      }),

    // Update version status
    updateVersionStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "active", "testing", "winner", "archived"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(contentVersions).set({
          status: input.status,
        }).where(
          and(
            eq(contentVersions.id, input.id),
            eq(contentVersions.userId, ctx.user.id)
          )
        );

        return { success: true };
      }),

    // Add annotation to version
    addVersionAnnotation: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const versions = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.id, input.id),
            eq(contentVersions.userId, ctx.user.id)
          ));

        if (!versions[0]) throw new Error("Version not found");

        const existingAnnotations = versions[0].annotations || [];
        const newAnnotation = {
          timestamp: new Date().toISOString(),
          note: input.note,
          author: ctx.user.name || "User",
        };

        await db.update(contentVersions).set({
          annotations: [...existingAnnotations, newAnnotation],
        }).where(eq(contentVersions.id, input.id));

        return { success: true };
      }),

    // Compare two versions (diff)
    compareVersions: protectedProcedure
      .input(z.object({
        versionAId: z.number(),
        versionBId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const versionA = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.id, input.versionAId),
            eq(contentVersions.userId, ctx.user.id)
          ));

        const versionB = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.id, input.versionBId),
            eq(contentVersions.userId, ctx.user.id)
          ));

        if (!versionA[0] || !versionB[0]) return null;

        // Simple diff - split by lines and compare
        const linesA = versionA[0].content.split('\n');
        const linesB = versionB[0].content.split('\n');

        const diff: { type: 'same' | 'added' | 'removed'; line: string }[] = [];
        const maxLen = Math.max(linesA.length, linesB.length);

        for (let i = 0; i < maxLen; i++) {
          const lineA = linesA[i];
          const lineB = linesB[i];

          if (lineA === lineB) {
            diff.push({ type: 'same', line: lineA || '' });
          } else {
            if (lineA !== undefined) diff.push({ type: 'removed', line: lineA });
            if (lineB !== undefined) diff.push({ type: 'added', line: lineB });
          }
        }

        return {
          versionA: versionA[0],
          versionB: versionB[0],
          diff,
          metricsComparison: {
            versionA: versionA[0].metrics,
            versionB: versionB[0].metrics,
          },
        };
      }),

    // Rollback to a specific version
    rollbackToVersion: protectedProcedure
      .input(z.object({
        versionId: z.number(),
        contentTemplateId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get the version to rollback to
        const versions = await db.select().from(contentVersions)
          .where(and(
            eq(contentVersions.id, input.versionId),
            eq(contentVersions.userId, ctx.user.id)
          ));

        if (!versions[0]) throw new Error("Version not found");

        // Update the main content template
        await db.update(contentTemplates).set({
          content: versions[0].content,
        }).where(
          and(
            eq(contentTemplates.id, input.contentTemplateId),
            eq(contentTemplates.userId, ctx.user.id)
          )
        );

        return { success: true, restoredContent: versions[0].content };
      }),

    // ============ EXPORT FUNCTIONALITY ============

    // Export to Google Docs
    exportToGoogleDocs: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number().optional(),
        contentVersionId: z.number().optional(),
        title: z.string(),
        content: z.string(),
        format: z.enum(["plain_text", "markdown", "rich_text"]).default("markdown"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // For now, we'll create a downloadable link and track the export
        // In production, this would integrate with Google Docs API
        
        const result = await db.insert(exportHistory).values({
          userId: ctx.user.id,
          contentTemplateId: input.contentTemplateId || null,
          contentVersionId: input.contentVersionId || null,
          destination: "google_docs",
          exportFormat: input.format,
          title: input.title,
          contentPreview: input.content.substring(0, 500),
          wordCount: input.content.split(/\s+/).length,
          status: "success",
          // In production, this would be the actual Google Docs URL
          externalUrl: null,
          externalId: null,
        });

        // Return the content formatted for Google Docs copy-paste
        let formattedContent = input.content;
        if (input.format === "plain_text") {
          formattedContent = input.content.replace(/[#*_`]/g, '');
        }

        return {
          success: true,
          exportId: result[0].insertId,
          formattedContent,
          message: "Content ready to paste into Google Docs. Copy the content below.",
        };
      }),

    // Export to Notion
    exportToNotion: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number().optional(),
        contentVersionId: z.number().optional(),
        title: z.string(),
        content: z.string(),
        format: z.enum(["plain_text", "markdown"]).default("markdown"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Track the export
        const result = await db.insert(exportHistory).values({
          userId: ctx.user.id,
          contentTemplateId: input.contentTemplateId || null,
          contentVersionId: input.contentVersionId || null,
          destination: "notion",
          exportFormat: input.format,
          title: input.title,
          contentPreview: input.content.substring(0, 500),
          wordCount: input.content.split(/\s+/).length,
          status: "success",
          externalUrl: null,
          externalId: null,
        });

        // Format content for Notion (Notion accepts markdown)
        return {
          success: true,
          exportId: result[0].insertId,
          formattedContent: input.content,
          message: "Content formatted for Notion. Copy and paste into a new Notion page.",
        };
      }),

    // Get export history
    getExportHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        destination: z.enum(["google_docs", "notion", "clipboard", "markdown_file", "pdf", "word"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let query = db.select().from(exportHistory)
          .where(eq(exportHistory.userId, ctx.user.id));

        const results = await query
          .orderBy(desc(exportHistory.exportedAt))
          .limit(input.limit);

        if (input.destination) {
          return results.filter(e => e.destination === input.destination);
        }

        return results;
      }),

    // Download as file
    downloadAsFile: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number().optional(),
        contentVersionId: z.number().optional(),
        title: z.string(),
        content: z.string(),
        format: z.enum(["markdown", "txt", "html"]).default("markdown"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Track the export
        await db.insert(exportHistory).values({
          userId: ctx.user.id,
          contentTemplateId: input.contentTemplateId || null,
          contentVersionId: input.contentVersionId || null,
          destination: "markdown_file",
          exportFormat: input.format,
          title: input.title,
          contentPreview: input.content.substring(0, 500),
          wordCount: input.content.split(/\s+/).length,
          status: "success",
        });

        let fileContent = input.content;
        let mimeType = "text/markdown";
        let extension = "md";

        if (input.format === "txt") {
          fileContent = input.content.replace(/[#*_`]/g, '');
          mimeType = "text/plain";
          extension = "txt";
        } else if (input.format === "html") {
          // Simple markdown to HTML conversion
          fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${input.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1, h2, h3 { margin-top: 1.5em; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
  <h1>${input.title}</h1>
  ${input.content
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')}
</body>
</html>`;
          mimeType = "text/html";
          extension = "html";
        }

        return {
          success: true,
          content: fileContent,
          filename: `${input.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`,
          mimeType,
        };
      }),

    // Batch export multiple content items
    batchExport: protectedProcedure
      .input(z.object({
        contentIds: z.array(z.number()).min(1).max(50),
        format: z.enum(["markdown", "txt", "html", "json"]).default("markdown"),
        exportType: z.enum(["combined", "individual"]).default("combined"),
        destination: z.enum(["file", "google_docs", "notion"]).default("file"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Fetch all content items
        const contentItems = await db.select().from(contentTemplates)
          .where(and(
            eq(contentTemplates.userId, ctx.user.id),
            sql`${contentTemplates.id} IN (${sql.join(input.contentIds.map(id => sql`${id}`), sql`, `)})`
          ));

        if (contentItems.length === 0) {
          throw new Error("No content items found");
        }

        // Format each item
        const formattedItems = contentItems.map(item => {
          let content = item.content || '';
          
          if (input.format === "txt") {
            content = content.replace(/[#*_`]/g, '');
          } else if (input.format === "html") {
            content = content
              .replace(/^### (.*$)/gm, '<h3>$1</h3>')
              .replace(/^## (.*$)/gm, '<h2>$1</h2>')
              .replace(/^# (.*$)/gm, '<h1>$1</h1>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/^- (.*$)/gm, '<li>$1</li>')
              .replace(/\n\n/g, '</p><p>');
          }
          
          return {
            id: item.id,
            title: item.title || `Content ${item.id}`,
            contentType: item.contentType,
            content,
            wordCount: content.split(/\s+/).length,
            createdAt: item.createdAt,
          };
        });

        // Build combined content for all destinations
        let combinedMarkdown = `# Batch Export - ${formattedItems.length} Items\n\nExported on ${new Date().toLocaleDateString()}\n\n---\n\n`;
        formattedItems.forEach((item, index) => {
          combinedMarkdown += `## ${index + 1}. ${item.title}\n\n`;
          combinedMarkdown += `**Type:** ${item.contentType} | **Words:** ${item.wordCount}\n\n`;
          combinedMarkdown += `${item.content}\n\n---\n\n`;
        });

        // Track the batch export
        await db.insert(exportHistory).values({
          userId: ctx.user.id,
          destination: input.destination === "google_docs" ? "batch_google_docs" : input.destination === "notion" ? "batch_notion" : "batch_file",
          exportFormat: input.format,
          title: `Batch Export (${formattedItems.length} items)`,
          contentPreview: `Exported ${formattedItems.length} content items to ${input.destination}`,
          wordCount: formattedItems.reduce((sum, item) => sum + item.wordCount, 0),
          status: "success",
        });

        // Handle Google Docs destination
        if (input.destination === "google_docs") {
          // For Google Docs, we return the content formatted for Google Docs
          // The frontend will open a new Google Doc with this content
          const googleDocsContent = formattedItems.map((item, index) => {
            return `${index + 1}. ${item.title}\n\nType: ${item.contentType} | Words: ${item.wordCount}\n\n${item.content}\n\n${'─'.repeat(50)}\n\n`;
          }).join('');

          return {
            success: true,
            destination: "google_docs",
            exportType: "combined",
            itemCount: formattedItems.length,
            totalWords: formattedItems.reduce((sum, item) => sum + item.wordCount, 0),
            content: googleDocsContent,
            googleDocsUrl: `https://docs.google.com/document/create`,
            message: `Ready to export ${formattedItems.length} items to Google Docs`,
          };
        }

        // Handle Notion destination
        if (input.destination === "notion") {
          // For Notion, we return Notion-flavored markdown
          // The frontend will copy this to clipboard for pasting into Notion
          const notionContent = formattedItems.map((item, index) => {
            // Convert to Notion-compatible format
            let content = item.content;
            // Notion uses different heading syntax and supports callouts
            return `## ${index + 1}. ${item.title}\n\n> **Type:** ${item.contentType} | **Words:** ${item.wordCount}\n\n${content}\n\n---\n\n`;
          }).join('');

          const fullNotionContent = `# Batch Export - ${formattedItems.length} Items\n\n> Exported on ${new Date().toLocaleDateString()}\n\n---\n\n${notionContent}`;

          return {
            success: true,
            destination: "notion",
            exportType: "combined",
            itemCount: formattedItems.length,
            totalWords: formattedItems.reduce((sum, item) => sum + item.wordCount, 0),
            content: fullNotionContent,
            message: `Ready to export ${formattedItems.length} items to Notion`,
          };
        }

        // Handle file destination (default)
        if (input.exportType === "combined") {
          // Combine all content into a single document
          let combinedContent = '';
          const extension = input.format === "html" ? "html" : input.format === "txt" ? "txt" : "md";
          
          if (input.format === "html") {
            combinedContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Batch Export - ${formattedItems.length} Items</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    .content-item { border-bottom: 2px solid #eee; padding: 20px 0; margin-bottom: 20px; }
    .content-item:last-child { border-bottom: none; }
    h1, h2, h3 { margin-top: 1.5em; }
    .item-meta { color: #666; font-size: 0.9em; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Batch Export - ${formattedItems.length} Items</h1>
  <p>Exported on ${new Date().toLocaleDateString()}</p>
  <hr>
`;
            formattedItems.forEach((item, index) => {
              combinedContent += `
  <div class="content-item">
    <h2>${index + 1}. ${item.title}</h2>
    <div class="item-meta">Type: ${item.contentType} | Words: ${item.wordCount}</div>
    <div class="content">${item.content}</div>
  </div>`;
            });
            combinedContent += `
</body>
</html>`;
          } else if (input.format === "json") {
            combinedContent = JSON.stringify({
              exportDate: new Date().toISOString(),
              itemCount: formattedItems.length,
              totalWords: formattedItems.reduce((sum, item) => sum + item.wordCount, 0),
              items: formattedItems,
            }, null, 2);
          } else {
            // Markdown or plain text
            combinedContent = `# Batch Export - ${formattedItems.length} Items\n\nExported on ${new Date().toLocaleDateString()}\n\n---\n\n`;
            formattedItems.forEach((item, index) => {
              combinedContent += `## ${index + 1}. ${item.title}\n\n`;
              combinedContent += `**Type:** ${item.contentType} | **Words:** ${item.wordCount}\n\n`;
              combinedContent += `${item.content}\n\n---\n\n`;
            });
          }

          return {
            success: true,
            exportType: "combined",
            itemCount: formattedItems.length,
            totalWords: formattedItems.reduce((sum, item) => sum + item.wordCount, 0),
            content: combinedContent,
            filename: `batch-export-${formattedItems.length}-items.${extension}`,
            mimeType: input.format === "html" ? "text/html" : input.format === "json" ? "application/json" : "text/plain",
          };
        } else {
          // Return individual files (for ZIP download on frontend)
          const extension = input.format === "html" ? "html" : input.format === "txt" ? "txt" : "md";
          
          return {
            success: true,
            exportType: "individual",
            itemCount: formattedItems.length,
            totalWords: formattedItems.reduce((sum, item) => sum + item.wordCount, 0),
            files: formattedItems.map(item => ({
              filename: `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`,
              content: item.content,
              mimeType: input.format === "html" ? "text/html" : "text/plain",
            })),
          };
        }
      }),

    // Get all generated content for batch selection
    getAllGeneratedContent: protectedProcedure
      .input(z.object({
        contentType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        search: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let conditions = [eq(contentTemplates.userId, ctx.user.id)];
        
        if (input.contentType) {
          conditions.push(eq(contentTemplates.contentType, input.contentType as any));
        }
        
        if (input.search) {
          conditions.push(
            or(
              like(contentTemplates.title, `%${input.search}%`),
              like(contentTemplates.content, `%${input.search}%`)
            ) || sql`1=1`
          );
        }

        const results = await db.select({
          id: contentTemplates.id,
          title: contentTemplates.title,
          contentType: contentTemplates.contentType,
          promptUsed: contentTemplates.promptUsed,
          wordCount: sql<number>`LENGTH(${contentTemplates.content}) - LENGTH(REPLACE(${contentTemplates.content}, ' ', '')) + 1`,
          createdAt: contentTemplates.createdAt,
          isFavorite: contentTemplates.isFavorite,
        }).from(contentTemplates)
          .where(and(...conditions))
          .orderBy(desc(contentTemplates.createdAt))
          .limit(input.limit);

        return results;
      }),

    // ========================================
    // A/B TEST WINNER AUTO-DETECTION
    // ========================================

    // Get A/B test analysis for a content template
    getAbTestAnalysis: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        // Get all versions for this content
        const versions = await db.select()
          .from(contentVersions)
          .where(and(
            eq(contentVersions.contentTemplateId, input.contentTemplateId),
            eq(contentVersions.userId, ctx.user.id)
          ))
          .orderBy(desc(contentVersions.versionNumber));

        if (versions.length < 2) {
          return { hasEnoughVersions: false, versions, winner: null, analysis: null };
        }

        // Calculate metrics for each version
        const versionMetrics = versions.map(v => {
          const metrics = v.metrics as {
            impressions?: number;
            clicks?: number;
            conversions?: number;
            ctr?: number;
            conversionRate?: number;
          } | null;

          const impressions = metrics?.impressions || 0;
          const clicks = metrics?.clicks || 0;
          const conversions = metrics?.conversions || 0;
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

          return {
            id: v.id,
            versionNumber: v.versionNumber,
            versionName: v.versionName,
            status: v.status,
            impressions,
            clicks,
            conversions,
            ctr,
            conversionRate,
            score: ctr * 0.4 + conversionRate * 0.6, // Weighted score
          };
        });

        // Find the winner based on score
        const sortedByScore = [...versionMetrics].sort((a, b) => b.score - a.score);
        const potentialWinner = sortedByScore[0];
        const runnerUp = sortedByScore[1];

        // Calculate statistical significance (simplified)
        const minSampleSize = 100;
        const hasEnoughData = potentialWinner.impressions >= minSampleSize && runnerUp.impressions >= minSampleSize;
        
        // Calculate uplift
        const uplift = runnerUp.score > 0 ? ((potentialWinner.score - runnerUp.score) / runnerUp.score) * 100 : 0;
        
        // Simplified confidence calculation based on sample size and uplift
        let confidence = 0;
        if (hasEnoughData) {
          const sampleFactor = Math.min(1, (potentialWinner.impressions + runnerUp.impressions) / 1000);
          const upliftFactor = Math.min(1, Math.abs(uplift) / 20);
          confidence = Math.min(99, 50 + sampleFactor * 25 + upliftFactor * 24);
        }

        const isStatisticallySignificant = confidence >= 95;
        const winner = isStatisticallySignificant ? potentialWinner : null;

        return {
          hasEnoughVersions: true,
          versions: versionMetrics,
          winner,
          analysis: {
            potentialWinner,
            runnerUp,
            uplift,
            confidence,
            isStatisticallySignificant,
            hasEnoughData,
            recommendation: isStatisticallySignificant
              ? `Version ${potentialWinner.versionName || potentialWinner.versionNumber} is the winner with ${uplift.toFixed(1)}% improvement`
              : hasEnoughData
                ? `More data needed. Current leader: Version ${potentialWinner.versionName || potentialWinner.versionNumber}`
                : `Need at least ${minSampleSize} impressions per version to determine winner`,
          },
        };
      }),

    // Declare a winner manually or auto
    declareAbTestWinner: protectedProcedure
      .input(z.object({
        contentTemplateId: z.number(),
        winnerVersionId: z.number(),
        declaredBy: z.enum(["auto", "manual"]).default("manual"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Update the winner version status
        await db.update(contentVersions)
          .set({ status: "winner" })
          .where(and(
            eq(contentVersions.id, input.winnerVersionId),
            eq(contentVersions.userId, ctx.user.id)
          ));

        // Archive other versions
        await db.update(contentVersions)
          .set({ status: "archived" })
          .where(and(
            eq(contentVersions.contentTemplateId, input.contentTemplateId),
            eq(contentVersions.userId, ctx.user.id),
            sql`${contentVersions.id} != ${input.winnerVersionId}`
          ));

        return { success: true, winnerVersionId: input.winnerVersionId };
      }),

    // ========================================
    // SCHEDULED CONTENT REFRESH
    // ========================================

    // Create a content refresh schedule
    createSchedule: protectedProcedure
      .input(z.object({
        savedTemplateId: z.number(),
        contentTemplateId: z.number().optional(),
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        timeOfDay: z.string().default("09:00"),
        timezone: z.string().default("UTC"),
        variables: z.record(z.string(), z.string()).optional(),
        notifyOnComplete: z.boolean().default(true),
        goal: z.enum(["improve_ctr", "increase_conversions", "boost_engagement", "reduce_bounce", "custom"]).optional(),
        goalTarget: z.number().optional(),
        goalMetric: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Calculate next run time
        const now = new Date();
        let nextRunAt = new Date();
        
        switch (input.frequency) {
          case "daily":
            nextRunAt.setDate(now.getDate() + 1);
            break;
          case "weekly":
            const daysUntilNext = ((input.dayOfWeek || 0) - now.getDay() + 7) % 7 || 7;
            nextRunAt.setDate(now.getDate() + daysUntilNext);
            break;
          case "biweekly":
            nextRunAt.setDate(now.getDate() + 14);
            break;
          case "monthly":
            nextRunAt.setMonth(now.getMonth() + 1);
            if (input.dayOfMonth) {
              nextRunAt.setDate(input.dayOfMonth);
            }
            break;
        }

        const [schedule] = await db.insert(contentSchedules).values({
          userId: ctx.user.id,
          savedTemplateId: input.savedTemplateId,
          contentTemplateId: input.contentTemplateId,
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          timeOfDay: input.timeOfDay,
          timezone: input.timezone,
          variables: input.variables,
          notifyOnComplete: input.notifyOnComplete,
          nextRunAt,
          status: "active",
        }).$returningId();

        return { success: true, scheduleId: schedule.id, nextRunAt };
      }),

    // Get user's schedules
    getSchedules: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const schedules = await db.select({
          id: contentSchedules.id,
          savedTemplateId: contentSchedules.savedTemplateId,
          frequency: contentSchedules.frequency,
          dayOfWeek: contentSchedules.dayOfWeek,
          dayOfMonth: contentSchedules.dayOfMonth,
          timeOfDay: contentSchedules.timeOfDay,
          timezone: contentSchedules.timezone,
          status: contentSchedules.status,
          lastRunAt: contentSchedules.lastRunAt,
          nextRunAt: contentSchedules.nextRunAt,
          runCount: contentSchedules.runCount,
          templateName: savedTemplates.name,
          templateType: savedTemplates.contentType,
        })
          .from(contentSchedules)
          .leftJoin(savedTemplates, eq(contentSchedules.savedTemplateId, savedTemplates.id))
          .where(eq(contentSchedules.userId, ctx.user.id))
          .orderBy(desc(contentSchedules.createdAt));

        return schedules;
      }),

    // Update schedule status (pause/resume)
    updateScheduleStatus: protectedProcedure
      .input(z.object({
        scheduleId: z.number(),
        status: z.enum(["active", "paused"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(contentSchedules)
          .set({ status: input.status })
          .where(and(
            eq(contentSchedules.id, input.scheduleId),
            eq(contentSchedules.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Delete a schedule
    deleteSchedule: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(contentSchedules)
          .where(and(
            eq(contentSchedules.id, input.scheduleId),
            eq(contentSchedules.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // ========================================
    // TEAM COLLABORATION & TEMPLATE SHARING
    // ========================================

    // Share a template with another user
    shareTemplate: protectedProcedure
      .input(z.object({
        savedTemplateId: z.number(),
        sharedWithEmail: z.string().email().optional(),
        permission: z.enum(["view", "duplicate", "edit"]).default("view"),
        shareType: z.enum(["direct", "link", "public"]).default("direct"),
        expiresInDays: z.number().min(1).max(365).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Generate share token for link-based sharing
        const shareToken = input.shareType === "link" || input.shareType === "public"
          ? Math.random().toString(36).substring(2) + Date.now().toString(36)
          : null;

        // Calculate expiration date
        const expiresAt = input.expiresInDays
          ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
          : null;

        const [share] = await db.insert(templateShares).values({
          savedTemplateId: input.savedTemplateId,
          ownerUserId: ctx.user.id,
          sharedWithEmail: input.sharedWithEmail,
          permission: input.permission,
          shareType: input.shareType,
          shareToken,
          status: input.shareType === "public" ? "accepted" : "pending",
          expiresAt,
        }).$returningId();

        // If making public, update the template
        if (input.shareType === "public") {
          await db.update(savedTemplates)
            .set({ isPublic: true })
            .where(eq(savedTemplates.id, input.savedTemplateId));
        }

        return {
          success: true,
          shareId: share.id,
          shareToken,
          shareUrl: shareToken ? `/templates/shared/${shareToken}` : null,
        };
      }),

    // Get templates shared with the current user
    getSharedWithMe: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const shared = await db.select({
          shareId: templateShares.id,
          permission: templateShares.permission,
          shareType: templateShares.shareType,
          status: templateShares.status,
          sharedAt: templateShares.createdAt,
          templateId: savedTemplates.id,
          templateName: savedTemplates.name,
          templateDescription: savedTemplates.description,
          templateType: savedTemplates.contentType,
          ownerName: sql<string>`(SELECT name FROM users WHERE id = ${templateShares.ownerUserId})`,
        })
          .from(templateShares)
          .innerJoin(savedTemplates, eq(templateShares.savedTemplateId, savedTemplates.id))
          .where(and(
            eq(templateShares.sharedWithEmail, ctx.user.email || ""),
            eq(templateShares.status, "accepted")
          ))
          .orderBy(desc(templateShares.createdAt));

        return shared;
      }),

    // Get public templates gallery
    getPublicTemplates: publicProcedure
      .input(z.object({
        contentType: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        let conditions = [eq(savedTemplates.isPublic, true)];
        
        if (input.contentType) {
          conditions.push(eq(savedTemplates.contentType, input.contentType as any));
        }
        
        if (input.search) {
          conditions.push(
            or(
              like(savedTemplates.name, `%${input.search}%`),
              like(savedTemplates.description, `%${input.search}%`)
            ) || sql`1=1`
          );
        }

        const templates = await db.select({
          id: savedTemplates.id,
          name: savedTemplates.name,
          description: savedTemplates.description,
          contentType: savedTemplates.contentType,
          category: savedTemplates.category,
          tags: savedTemplates.tags,
          useCount: savedTemplates.useCount,
          createdAt: savedTemplates.createdAt,
          ownerName: sql<string>`(SELECT name FROM users WHERE id = ${savedTemplates.userId})`,
        })
          .from(savedTemplates)
          .where(and(...conditions))
          .orderBy(desc(savedTemplates.useCount))
          .limit(input.limit);

        return templates;
      }),

    // Duplicate a shared template
    duplicateTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        shareToken: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get the original template
        const [original] = await db.select()
          .from(savedTemplates)
          .where(eq(savedTemplates.id, input.templateId));

        if (!original) throw new Error("Template not found");

        // Check if user has permission (public or shared)
        if (!original.isPublic && original.userId !== ctx.user.id) {
          // Check for share permission
          const [share] = await db.select()
            .from(templateShares)
            .where(and(
              eq(templateShares.savedTemplateId, input.templateId),
              or(
                eq(templateShares.sharedWithEmail, ctx.user.email || ""),
                input.shareToken ? eq(templateShares.shareToken, input.shareToken) : sql`1=0`
              ),
              or(
                eq(templateShares.permission, "duplicate"),
                eq(templateShares.permission, "edit")
              )
            ));

          if (!share) throw new Error("No permission to duplicate this template");

          // Update duplicate count
          await db.update(templateShares)
            .set({ duplicateCount: sql`${templateShares.duplicateCount} + 1` })
            .where(eq(templateShares.id, share.id));
        }

        // Create the duplicate
        const [newTemplate] = await db.insert(savedTemplates).values({
          userId: ctx.user.id,
          name: `${original.name} (Copy)`,
          description: original.description,
          contentType: original.contentType,
          templateContent: original.templateContent,
          variables: original.variables,
          frameworkUsed: original.frameworkUsed,
          tone: original.tone,
          category: original.category,
          tags: original.tags,
          isPublic: false,
        }).$returningId();

        // Update use count on original
        await db.update(savedTemplates)
          .set({ useCount: sql`${savedTemplates.useCount} + 1` })
          .where(eq(savedTemplates.id, input.templateId));

        return { success: true, newTemplateId: newTemplate.id };
      }),

    // Accept or decline a share invitation
    respondToShare: protectedProcedure
      .input(z.object({
        shareId: z.number(),
        response: z.enum(["accepted", "declined"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(templateShares)
          .set({ status: input.response })
          .where(and(
            eq(templateShares.id, input.shareId),
            eq(templateShares.sharedWithEmail, ctx.user.email || "")
          ));

        return { success: true };
      }),

    // Revoke a share
    revokeShare: protectedProcedure
      .input(z.object({ shareId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(templateShares)
          .set({ status: "revoked" })
          .where(and(
            eq(templateShares.id, input.shareId),
            eq(templateShares.ownerUserId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Get shares for a template (owner view)
    getTemplateShares: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const shares = await db.select()
          .from(templateShares)
          .where(and(
            eq(templateShares.savedTemplateId, input.templateId),
            eq(templateShares.ownerUserId, ctx.user.id)
          ))
          .orderBy(desc(templateShares.createdAt));

        return shares;
      }),

    // ========================================
    // SCHEDULE GOALS
    // ========================================

    // Create a goal for a schedule
    createScheduleGoal: protectedProcedure
      .input(z.object({
        scheduleId: z.number(),
        goalType: z.enum(["improve_ctr", "increase_conversions", "boost_engagement", "reduce_bounce", "increase_revenue", "grow_audience", "improve_quality_score"]),
        targetMetric: z.string(),
        targetValue: z.number(),
        baselineValue: z.number().optional(),
        deadline: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [goal] = await db.insert(scheduleGoals).values({
          scheduleId: input.scheduleId,
          userId: ctx.user.id,
          goalType: input.goalType,
          targetMetric: input.targetMetric,
          targetValue: input.targetValue.toString(),
          baselineValue: input.baselineValue?.toString(),
          deadline: input.deadline ? new Date(input.deadline) : null,
        }).$returningId();

        return { success: true, goalId: goal.id };
      }),

    // Get goals for a schedule
    getScheduleGoals: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const goals = await db.select()
          .from(scheduleGoals)
          .where(and(
            eq(scheduleGoals.scheduleId, input.scheduleId),
            eq(scheduleGoals.userId, ctx.user.id)
          ))
          .orderBy(desc(scheduleGoals.createdAt));

        return goals;
      }),

    // Update goal progress
    updateGoalProgress: protectedProcedure
      .input(z.object({
        goalId: z.number(),
        currentValue: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get the goal to calculate progress
        const [goal] = await db.select()
          .from(scheduleGoals)
          .where(and(
            eq(scheduleGoals.id, input.goalId),
            eq(scheduleGoals.userId, ctx.user.id)
          ));

        if (!goal) throw new Error("Goal not found");

        const targetValue = parseFloat(goal.targetValue);
        const baselineValue = goal.baselineValue ? parseFloat(goal.baselineValue) : 0;
        const progressRange = targetValue - baselineValue;
        const currentProgress = input.currentValue - baselineValue;
        const progressPercentage = progressRange > 0 ? Math.min(100, (currentProgress / progressRange) * 100) : 0;

        // Determine status
        let status: "on_track" | "behind" | "achieved" | "failed" = "on_track";
        if (progressPercentage >= 100) {
          status = "achieved";
        } else if (goal.deadline && new Date(goal.deadline) < new Date()) {
          status = progressPercentage >= 100 ? "achieved" : "failed";
        } else if (progressPercentage < 50 && goal.deadline) {
          const timeElapsed = (Date.now() - new Date(goal.createdAt).getTime()) / (new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime());
          if (progressPercentage < timeElapsed * 100 * 0.8) {
            status = "behind";
          }
        }

        await db.update(scheduleGoals)
          .set({
            currentValue: input.currentValue.toString(),
            progressPercentage: progressPercentage.toFixed(2),
            status,
            achievedAt: status === "achieved" ? new Date() : null,
          })
          .where(eq(scheduleGoals.id, input.goalId));

        return { success: true, progressPercentage, status };
      }),

    // Generate AI suggestions for improving goal metrics
    generateGoalSuggestions: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [goal] = await db.select()
          .from(scheduleGoals)
          .where(and(
            eq(scheduleGoals.id, input.goalId),
            eq(scheduleGoals.userId, ctx.user.id)
          ));

        if (!goal) throw new Error("Goal not found");

        const goalTypeDescriptions: Record<string, string> = {
          improve_ctr: "improving click-through rate",
          increase_conversions: "increasing conversion rate",
          boost_engagement: "boosting user engagement",
          reduce_bounce: "reducing bounce rate",
          increase_revenue: "increasing revenue",
          grow_audience: "growing audience size",
          improve_quality_score: "improving content quality score",
        };

        const prompt = `You are a marketing optimization expert. The user has a goal of ${goalTypeDescriptions[goal.goalType] || goal.goalType}.

Current metrics:
- Target: ${goal.targetValue}%
- Current: ${goal.currentValue || goal.baselineValue || 0}%
- Progress: ${goal.progressPercentage || 0}%
- Status: ${goal.status}

Provide 5 specific, actionable suggestions to help achieve this goal. Focus on:
1. Content optimization techniques
2. Headline/copy improvements
3. Call-to-action enhancements
4. Audience targeting refinements
5. Testing and iteration strategies

Format each suggestion as a brief, actionable item.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a marketing optimization expert providing actionable advice." },
            { role: "user", content: prompt }
          ]
        });

        const suggestionContent = response.choices[0]?.message?.content;
        const suggestion = typeof suggestionContent === 'string' ? suggestionContent : "Unable to generate suggestions";

        await db.update(scheduleGoals)
          .set({
            lastSuggestion: suggestion,
            suggestionGeneratedAt: new Date(),
          })
          .where(eq(scheduleGoals.id, input.goalId));

        return { success: true, suggestion };
      }),

    // Delete a goal
    deleteScheduleGoal: protectedProcedure
      .input(z.object({ goalId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(scheduleGoals)
          .where(and(
            eq(scheduleGoals.id, input.goalId),
            eq(scheduleGoals.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // ========================================
    // TEMPLATE COMMENTS & DISCUSSION
    // ========================================

    // Add a comment to a template
    addTemplateComment: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        content: z.string().min(1).max(5000),
        parentId: z.number().optional(),
        mentionedUserIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [comment] = await db.insert(templateComments).values({
          templateId: input.templateId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
          mentionedUserIds: input.mentionedUserIds,
        }).$returningId();

        return { success: true, commentId: comment.id };
      }),

    // Get comments for a template
    getTemplateComments: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const commentsData = await db.select({
          id: templateComments.id,
          content: templateComments.content,
          parentId: templateComments.parentId,
          likeCount: templateComments.likeCount,
          isEdited: templateComments.isEdited,
          createdAt: templateComments.createdAt,
          userId: templateComments.userId,
          userName: users.name,
          mentionedUserIds: templateComments.mentionedUserIds,
        })
          .from(templateComments)
          .leftJoin(users, eq(templateComments.userId, users.id))
          .where(and(
            eq(templateComments.templateId, input.templateId),
            eq(templateComments.isDeleted, false)
          ))
          .orderBy(templateComments.createdAt);

        // Organize into threads
        const topLevel = commentsData.filter(c => !c.parentId);
        const replies = commentsData.filter(c => c.parentId);

        return topLevel.map(comment => ({
          ...comment,
          replies: replies.filter(r => r.parentId === comment.id),
        }));
      }),

    // Edit a comment
    editTemplateComment: protectedProcedure
      .input(z.object({
        commentId: z.number(),
        content: z.string().min(1).max(5000),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(templateComments)
          .set({
            content: input.content,
            isEdited: true,
          })
          .where(and(
            eq(templateComments.id, input.commentId),
            eq(templateComments.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Delete a comment (soft delete)
    deleteTemplateComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(templateComments)
          .set({ isDeleted: true })
          .where(and(
            eq(templateComments.id, input.commentId),
            eq(templateComments.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Like/unlike a comment
    toggleCommentLike: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Check if already liked
        const [existingLike] = await db.select()
          .from(commentLikes)
          .where(and(
            eq(commentLikes.commentId, input.commentId),
            eq(commentLikes.userId, ctx.user.id)
          ));

        if (existingLike) {
          // Unlike
          await db.delete(commentLikes)
            .where(eq(commentLikes.id, existingLike.id));
          await db.update(templateComments)
            .set({ likeCount: sql`${templateComments.likeCount} - 1` })
            .where(eq(templateComments.id, input.commentId));
          return { success: true, liked: false };
        } else {
          // Like
          await db.insert(commentLikes).values({
            commentId: input.commentId,
            userId: ctx.user.id,
          });
          await db.update(templateComments)
            .set({ likeCount: sql`${templateComments.likeCount} + 1` })
            .where(eq(templateComments.id, input.commentId));
          return { success: true, liked: true };
        }
      }),

    // Get comment count for a template
    getTemplateCommentCount: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return 0;

        const [result] = await db.select({ count: sql<number>`count(*)` })
          .from(templateComments)
          .where(and(
            eq(templateComments.templateId, input.templateId),
            eq(templateComments.isDeleted, false)
          ));

        return result?.count || 0;
      }),
  }),

  // ========================================
  // COMPETITOR ANALYSIS
  // ========================================
  competitorAnalysis: router({
    // Create a competitor
    createCompetitor: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        website: z.string().url().optional(),
        logoUrl: z.string().optional(),
        industry: z.string().optional(),
        category: z.string().optional(),
        competitorType: z.enum(["direct", "indirect", "aspirational"]).default("direct"),
        description: z.string().optional(),
        tagline: z.string().optional(),
        youtubeChannelId: z.string().optional(),
        youtubeChannelUrl: z.string().optional(),
        twitterHandle: z.string().optional(),
        linkedinUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        foundedYear: z.number().optional(),
        employeeCount: z.string().optional(),
        fundingStage: z.string().optional(),
        estimatedRevenue: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [competitor] = await db.insert(competitors).values({
          userId: ctx.user.id,
          ...input,
        }).$returningId();

        return { success: true, competitorId: competitor.id };
      }),

    // Get all competitors
    getCompetitors: protectedProcedure
      .input(z.object({
        type: z.enum(["direct", "indirect", "aspirational", "all"]).default("all"),
        industry: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        let query = db.select()
          .from(competitors)
          .where(and(
            eq(competitors.userId, ctx.user.id),
            eq(competitors.isActive, true)
          ));

        const results = await query.orderBy(desc(competitors.createdAt));

        // Filter by type if specified
        if (input?.type && input.type !== "all") {
          return results.filter(c => c.competitorType === input.type);
        }

        // Filter by industry if specified
        if (input?.industry) {
          return results.filter(c => c.industry === input.industry);
        }

        return results;
      }),

    // Get a single competitor
    getCompetitor: protectedProcedure
      .input(z.object({ competitorId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const [competitor] = await db.select()
          .from(competitors)
          .where(and(
            eq(competitors.id, input.competitorId),
            eq(competitors.userId, ctx.user.id)
          ));

        return competitor || null;
      }),

    // Update a competitor
    updateCompetitor: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        name: z.string().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
        industry: z.string().optional(),
        category: z.string().optional(),
        competitorType: z.enum(["direct", "indirect", "aspirational"]).optional(),
        description: z.string().optional(),
        tagline: z.string().optional(),
        youtubeChannelId: z.string().optional(),
        youtubeChannelUrl: z.string().optional(),
        twitterHandle: z.string().optional(),
        linkedinUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        foundedYear: z.number().optional(),
        employeeCount: z.string().optional(),
        fundingStage: z.string().optional(),
        estimatedRevenue: z.string().optional(),
        notes: z.string().optional(),
        strengths: z.array(z.string()).optional(),
        weaknesses: z.array(z.string()).optional(),
        opportunities: z.array(z.string()).optional(),
        threats: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const { competitorId, ...updateData } = input;

        await db.update(competitors)
          .set(updateData)
          .where(and(
            eq(competitors.id, competitorId),
            eq(competitors.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Delete a competitor (soft delete)
    deleteCompetitor: protectedProcedure
      .input(z.object({ competitorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(competitors)
          .set({ isActive: false })
          .where(and(
            eq(competitors.id, input.competitorId),
            eq(competitors.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Add a product to a competitor
    addCompetitorProduct: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        productUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        priceType: z.enum(["one_time", "subscription", "freemium", "custom", "free"]).default("one_time"),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        priceCurrency: z.string().default("USD"),
        pricingNotes: z.string().optional(),
        features: z.array(z.string()).optional(),
        uniqueSellingPoints: z.array(z.string()).optional(),
        targetAudience: z.string().optional(),
        positioning: z.string().optional(),
        comparisonToOurs: z.enum(["better", "similar", "worse", "different"]).optional(),
        comparisonNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [product] = await db.insert(competitorProducts).values({
          userId: ctx.user.id,
          competitorId: input.competitorId,
          name: input.name,
          description: input.description,
          productUrl: input.productUrl,
          imageUrl: input.imageUrl,
          priceType: input.priceType,
          priceMin: input.priceMin?.toString(),
          priceMax: input.priceMax?.toString(),
          priceCurrency: input.priceCurrency,
          pricingNotes: input.pricingNotes,
          features: input.features,
          uniqueSellingPoints: input.uniqueSellingPoints,
          targetAudience: input.targetAudience,
          positioning: input.positioning,
          comparisonToOurs: input.comparisonToOurs,
          comparisonNotes: input.comparisonNotes,
        }).$returningId();

        return { success: true, productId: product.id };
      }),

    // Get products for a competitor
    getCompetitorProducts: protectedProcedure
      .input(z.object({ competitorId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const products = await db.select()
          .from(competitorProducts)
          .where(and(
            eq(competitorProducts.competitorId, input.competitorId),
            eq(competitorProducts.userId, ctx.user.id),
            eq(competitorProducts.isActive, true)
          ))
          .orderBy(desc(competitorProducts.createdAt));

        return products;
      }),

    // Update a product
    updateCompetitorProduct: protectedProcedure
      .input(z.object({
        productId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        productUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        priceType: z.enum(["one_time", "subscription", "freemium", "custom", "free"]).optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        pricingNotes: z.string().optional(),
        features: z.array(z.string()).optional(),
        uniqueSellingPoints: z.array(z.string()).optional(),
        targetAudience: z.string().optional(),
        positioning: z.string().optional(),
        comparisonToOurs: z.enum(["better", "similar", "worse", "different"]).optional(),
        comparisonNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const { productId, priceMin, priceMax, ...updateData } = input;

        await db.update(competitorProducts)
          .set({
            ...updateData,
            priceMin: priceMin?.toString(),
            priceMax: priceMax?.toString(),
          })
          .where(and(
            eq(competitorProducts.id, productId),
            eq(competitorProducts.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Delete a product
    deleteCompetitorProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(competitorProducts)
          .set({ isActive: false })
          .where(and(
            eq(competitorProducts.id, input.productId),
            eq(competitorProducts.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Add content tracking for a competitor
    addCompetitorContent: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        title: z.string().min(1).max(512),
        contentType: z.enum(["blog_post", "video", "podcast", "social_post", "ad", "landing_page", "email", "webinar", "case_study", "whitepaper", "other"]),
        url: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        description: z.string().optional(),
        publishedAt: z.string().optional(),
        views: z.number().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        shares: z.number().optional(),
        keyTopics: z.array(z.string()).optional(),
        targetKeywords: z.array(z.string()).optional(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        qualityScore: z.number().min(1).max(10).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [content] = await db.insert(competitorContent).values({
          userId: ctx.user.id,
          competitorId: input.competitorId,
          title: input.title,
          contentType: input.contentType,
          url: input.url,
          thumbnailUrl: input.thumbnailUrl,
          description: input.description,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
          views: input.views,
          likes: input.likes,
          comments: input.comments,
          shares: input.shares,
          keyTopics: input.keyTopics,
          targetKeywords: input.targetKeywords,
          sentiment: input.sentiment,
          qualityScore: input.qualityScore,
          notes: input.notes,
        }).$returningId();

        return { success: true, contentId: content.id };
      }),

    // Get content for a competitor
    getCompetitorContent: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        contentType: z.enum(["blog_post", "video", "podcast", "social_post", "ad", "landing_page", "email", "webinar", "case_study", "whitepaper", "other", "all"]).default("all"),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const content = await db.select()
          .from(competitorContent)
          .where(and(
            eq(competitorContent.competitorId, input.competitorId),
            eq(competitorContent.userId, ctx.user.id)
          ))
          .orderBy(desc(competitorContent.publishedAt));

        if (input.contentType !== "all") {
          return content.filter(c => c.contentType === input.contentType);
        }

        return content;
      }),

    // Analyze competitor content with AI
    analyzeCompetitorContent: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [content] = await db.select()
          .from(competitorContent)
          .where(and(
            eq(competitorContent.id, input.contentId),
            eq(competitorContent.userId, ctx.user.id)
          ));

        if (!content) throw new Error("Content not found");

        const prompt = `Analyze this competitor content:

Title: ${content.title}
Type: ${content.contentType}
Description: ${content.description || "N/A"}
URL: ${content.url || "N/A"}

Provide analysis including:
1. Key messaging and value propositions
2. Target audience indicators
3. Content quality assessment
4. SEO/keyword strategy observations
5. Engagement tactics used
6. Content gaps or opportunities for us
7. Recommendations for our content strategy

Format as a structured analysis.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a competitive intelligence analyst specializing in content marketing." },
            { role: "user", content: prompt }
          ]
        });

        const analysisContent = response.choices[0]?.message?.content;
        const analysis = typeof analysisContent === 'string' ? analysisContent : "Unable to generate analysis";

        await db.update(competitorContent)
          .set({
            aiAnalysis: analysis,
            analyzedAt: new Date(),
          })
          .where(eq(competitorContent.id, input.contentId));

        return { success: true, analysis };
      }),

    // Create a comparison between competitors
    createComparison: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        competitorIds: z.array(z.number()).min(2).max(10),
        dimensions: z.array(z.object({
          name: z.string(),
          weight: z.number().min(0).max(100),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [comparison] = await db.insert(competitorComparisons).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          competitorIds: input.competitorIds,
          dimensions: input.dimensions?.map(d => ({ ...d, scores: {} })),
        }).$returningId();

        return { success: true, comparisonId: comparison.id };
      }),

    // Get all comparisons
    getComparisons: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const comparisons = await db.select()
          .from(competitorComparisons)
          .where(eq(competitorComparisons.userId, ctx.user.id))
          .orderBy(desc(competitorComparisons.createdAt));

        return comparisons;
      }),

    // Get a single comparison with competitor details
    getComparison: protectedProcedure
      .input(z.object({ comparisonId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const [comparison] = await db.select()
          .from(competitorComparisons)
          .where(and(
            eq(competitorComparisons.id, input.comparisonId),
            eq(competitorComparisons.userId, ctx.user.id)
          ));

        if (!comparison) return null;

        // Get competitor details
        const competitorDetails = await db.select()
          .from(competitors)
          .where(and(
            sql`${competitors.id} IN (${sql.join(comparison.competitorIds.map(id => sql`${id}`), sql`, `)})`,
            eq(competitors.userId, ctx.user.id)
          ));

        return {
          ...comparison,
          competitors: competitorDetails,
        };
      }),

    // Update comparison scores
    updateComparisonScores: protectedProcedure
      .input(z.object({
        comparisonId: z.number(),
        dimensions: z.array(z.object({
          name: z.string(),
          weight: z.number(),
          scores: z.record(z.string(), z.number()), // competitorId -> score
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Calculate overall scores
        const overallScores: Record<number, number> = {};
        for (const dim of input.dimensions) {
          for (const [competitorId, score] of Object.entries(dim.scores)) {
            const id = parseInt(competitorId);
            if (!overallScores[id]) overallScores[id] = 0;
            overallScores[id] += (score * dim.weight) / 100;
          }
        }

        await db.update(competitorComparisons)
          .set({
            dimensions: input.dimensions,
            overallScores,
          })
          .where(and(
            eq(competitorComparisons.id, input.comparisonId),
            eq(competitorComparisons.userId, ctx.user.id)
          ));

        return { success: true, overallScores };
      }),

    // Generate AI insights for a comparison
    generateComparisonInsights: protectedProcedure
      .input(z.object({ comparisonId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [comparison] = await db.select()
          .from(competitorComparisons)
          .where(and(
            eq(competitorComparisons.id, input.comparisonId),
            eq(competitorComparisons.userId, ctx.user.id)
          ));

        if (!comparison) throw new Error("Comparison not found");

        // Get competitor details
        const competitorDetails = await db.select()
          .from(competitors)
          .where(and(
            sql`${competitors.id} IN (${sql.join(comparison.competitorIds.map(id => sql`${id}`), sql`, `)})`,
            eq(competitors.userId, ctx.user.id)
          ));

        const prompt = `Analyze this competitive comparison:

Competitors being compared:
${competitorDetails.map(c => `- ${c.name}: ${c.description || "No description"}`).join("\n")}

Comparison dimensions and scores:
${comparison.dimensions ? JSON.stringify(comparison.dimensions, null, 2) : "No scores yet"}

Overall scores:
${comparison.overallScores ? JSON.stringify(comparison.overallScores, null, 2) : "No overall scores yet"}

Provide:
1. Key competitive insights
2. SWOT analysis summary
3. Positioning recommendations
4. Opportunities to differentiate
5. Threats to address
6. Strategic recommendations

Format as a comprehensive competitive analysis report.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a strategic competitive intelligence analyst." },
            { role: "user", content: prompt }
          ]
        });

        const insightsContent = response.choices[0]?.message?.content;
        const insights = typeof insightsContent === 'string' ? insightsContent : "Unable to generate insights";

        // Extract SWOT from insights (simplified)
        const swotAnalysis = {
          strengths: ["Based on comparison analysis"],
          weaknesses: ["Areas for improvement identified"],
          opportunities: ["Market gaps discovered"],
          threats: ["Competitive pressures noted"],
        };

        await db.update(competitorComparisons)
          .set({
            aiInsights: insights,
            swotAnalysis,
            positioningRecommendation: insights.substring(0, 500),
          })
          .where(eq(competitorComparisons.id, input.comparisonId));

        return { success: true, insights, swotAnalysis };
      }),

    // Generate SWOT analysis for a competitor
    generateSwotAnalysis: protectedProcedure
      .input(z.object({ competitorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [competitor] = await db.select()
          .from(competitors)
          .where(and(
            eq(competitors.id, input.competitorId),
            eq(competitors.userId, ctx.user.id)
          ));

        if (!competitor) throw new Error("Competitor not found");

        // Get their products
        const products = await db.select()
          .from(competitorProducts)
          .where(and(
            eq(competitorProducts.competitorId, input.competitorId),
            eq(competitorProducts.isActive, true)
          ));

        // Get their content
        const content = await db.select()
          .from(competitorContent)
          .where(eq(competitorContent.competitorId, input.competitorId))
          .limit(10);

        const prompt = `Generate a comprehensive SWOT analysis for this competitor:

Competitor: ${competitor.name}
Website: ${competitor.website || "N/A"}
Industry: ${competitor.industry || "N/A"}
Description: ${competitor.description || "N/A"}
Tagline: ${competitor.tagline || "N/A"}
Founded: ${competitor.foundedYear || "N/A"}
Employees: ${competitor.employeeCount || "N/A"}
Funding: ${competitor.fundingStage || "N/A"}

Products/Services:
${products.map(p => `- ${p.name}: ${p.description || "No description"} (${p.priceType})`).join("\n") || "No products tracked"}

Recent Content:
${content.map(c => `- ${c.title} (${c.contentType})`).join("\n") || "No content tracked"}

Provide a detailed SWOT analysis with 5-7 items for each category:
1. Strengths - What they do well
2. Weaknesses - Where they fall short
3. Opportunities - Market gaps they could exploit
4. Threats - External factors that could hurt them

Format as JSON with arrays for each category.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a strategic business analyst. Return only valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "swot_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  strengths: { type: "array", items: { type: "string" } },
                  weaknesses: { type: "array", items: { type: "string" } },
                  opportunities: { type: "array", items: { type: "string" } },
                  threats: { type: "array", items: { type: "string" } },
                },
                required: ["strengths", "weaknesses", "opportunities", "threats"],
                additionalProperties: false,
              },
            },
          },
        });

        let swot = {
          strengths: [] as string[],
          weaknesses: [] as string[],
          opportunities: [] as string[],
          threats: [] as string[],
        };

        try {
          const content = response.choices[0]?.message?.content;
          if (content && typeof content === 'string') {
            swot = JSON.parse(content);
          }
        } catch (e) {
          // Use defaults if parsing fails
        }

        await db.update(competitors)
          .set({
            strengths: swot.strengths,
            weaknesses: swot.weaknesses,
            opportunities: swot.opportunities,
            threats: swot.threats,
            lastAnalyzedAt: new Date(),
          })
          .where(eq(competitors.id, input.competitorId));

        return { success: true, swot };
      }),

    // Delete a comparison
    deleteComparison: protectedProcedure
      .input(z.object({ comparisonId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(competitorComparisons)
          .where(and(
            eq(competitorComparisons.id, input.comparisonId),
            eq(competitorComparisons.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // ========================================
    // YOUTUBE CHANNEL COMPARISON
    // ========================================

    // Add YouTube channel to competitor
    addYouTubeChannel: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        channelId: z.string(),
        channelName: z.string(),
        channelHandle: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        description: z.string().optional(),
        subscriberCount: z.number().optional(),
        videoCount: z.number().optional(),
        viewCount: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [channel] = await db.insert(competitorYouTubeChannels).values({
          competitorId: input.competitorId,
          userId: ctx.user.id,
          channelId: input.channelId,
          channelName: input.channelName,
          channelHandle: input.channelHandle,
          thumbnailUrl: input.thumbnailUrl,
          description: input.description,
          subscriberCount: input.subscriberCount,
          videoCount: input.videoCount,
          viewCount: input.viewCount,
        }).$returningId();

        return { success: true, channelId: channel.id };
      }),

    // Get YouTube channels for a competitor
    getYouTubeChannels: protectedProcedure
      .input(z.object({ competitorId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const conditions = [eq(competitorYouTubeChannels.userId, ctx.user.id)];
        if (input.competitorId) {
          conditions.push(eq(competitorYouTubeChannels.competitorId, input.competitorId));
        }

        const channels = await db.select()
          .from(competitorYouTubeChannels)
          .where(and(...conditions))
          .orderBy(desc(competitorYouTubeChannels.subscriberCount));

        return channels;
      }),

    // Analyze YouTube channel
    analyzeYouTubeChannel: protectedProcedure
      .input(z.object({
        channelDbId: z.number(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [channel] = await db.select()
          .from(competitorYouTubeChannels)
          .where(and(
            eq(competitorYouTubeChannels.id, input.channelDbId),
            eq(competitorYouTubeChannels.userId, ctx.user.id)
          ));

        if (!channel) throw new Error("Channel not found");

        // Fetch channel data from YouTube API
        youtubeClient.setApiKey(input.apiKey);
        const channelData = await youtubeClient.getChannelById(channel.channelId);

        if (!channelData.items || channelData.items.length === 0) {
          throw new Error("Channel not found on YouTube");
        }

        const ytChannel = channelData.items[0];
        const stats = ytChannel.statistics || { viewCount: '0', videoCount: '0', subscriberCount: '0' };
        const snippet = ytChannel.snippet;

        // Calculate engagement metrics (sample based on recent videos)
        const avgViews = Math.floor(Number(stats.viewCount || 0) / Math.max(Number(stats.videoCount || 1), 1));
        const engagementRate = Number(stats.subscriberCount || 0) > 0 
          ? (avgViews / Number(stats.subscriberCount || 1)) * 100 
          : 0;

        // Determine posting frequency (estimate)
        const videoCount = Number(stats.videoCount || 0);
        const channelAge = new Date().getFullYear() - new Date(snippet.publishedAt).getFullYear();
        const videosPerYear = videoCount / Math.max(channelAge, 1);
        let postingFrequency = "Unknown";
        if (videosPerYear > 365) postingFrequency = "Daily+";
        else if (videosPerYear > 156) postingFrequency = "3-4 per week";
        else if (videosPerYear > 52) postingFrequency = "1-3 per week";
        else if (videosPerYear > 12) postingFrequency = "1-4 per month";
        else postingFrequency = "Less than monthly";

        // Update channel with fresh data
        await db.update(competitorYouTubeChannels)
          .set({
            channelName: snippet.title,
            thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
            bannerUrl: (ytChannel as any).brandingSettings?.image?.bannerExternalUrl,
            description: snippet.description,
            subscriberCount: Number(stats.subscriberCount || 0),
            videoCount: Number(stats.videoCount || 0),
            viewCount: Number(stats.viewCount || 0),
            avgViews,
            engagementRate: engagementRate.toFixed(4),
            postingFrequency,
            lastAnalyzedAt: new Date(),
          })
          .where(eq(competitorYouTubeChannels.id, input.channelDbId));

        return {
          success: true,
          channelName: snippet.title,
          subscriberCount: Number(stats.subscriberCount || 0),
          videoCount: Number(stats.videoCount || 0),
          viewCount: Number(stats.viewCount || 0),
          avgViews,
          engagementRate,
          postingFrequency,
        };
      }),

    // Compare YouTube channels
    compareYouTubeChannels: protectedProcedure
      .input(z.object({
        channelDbIds: z.array(z.number()).min(2).max(10),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get channel data
        const channels = await db.select()
          .from(competitorYouTubeChannels)
          .where(and(
            sql`${competitorYouTubeChannels.id} IN (${sql.join(input.channelDbIds.map(id => sql`${id}`), sql`, `)})`,
            eq(competitorYouTubeChannels.userId, ctx.user.id)
          ));

        if (channels.length < 2) {
          throw new Error("Need at least 2 channels to compare");
        }

        // Build metrics comparison
        const metricsComparison = channels.map(ch => ({
          channelId: ch.id,
          channelName: ch.channelName,
          subscribers: ch.subscriberCount || 0,
          videos: ch.videoCount || 0,
          totalViews: ch.viewCount || 0,
          avgViews: ch.avgViews || 0,
          avgLikes: ch.avgLikes || 0,
          avgComments: ch.avgComments || 0,
          engagementRate: Number(ch.engagementRate) || 0,
          postingFrequency: ch.postingFrequency || "Unknown",
        }));

        // Find winner (highest engagement rate)
        const winner = metricsComparison.reduce((best, ch) => 
          ch.engagementRate > best.engagementRate ? ch : best
        );

        // Identify opportunities and threats
        const opportunities: string[] = [];
        const threats: string[] = [];

        const avgSubscribers = metricsComparison.reduce((sum, ch) => sum + ch.subscribers, 0) / metricsComparison.length;
        const avgEngagement = metricsComparison.reduce((sum, ch) => sum + ch.engagementRate, 0) / metricsComparison.length;

        metricsComparison.forEach(ch => {
          if (ch.subscribers < avgSubscribers && ch.engagementRate > avgEngagement) {
            opportunities.push(`${ch.channelName} has high engagement but lower reach - opportunity for growth`);
          }
          if (ch.subscribers > avgSubscribers * 2) {
            threats.push(`${ch.channelName} dominates in subscriber count`);
          }
        });

        // Create comparison record
        const [comparison] = await db.insert(youtubeChannelComparisons).values({
          userId: ctx.user.id,
          name: input.name || `Channel Comparison - ${new Date().toLocaleDateString()}`,
          channelIds: input.channelDbIds,
          metricsComparison,
          winner: winner.channelId,
          winnerReason: `Highest engagement rate at ${winner.engagementRate.toFixed(2)}%`,
          opportunities,
          threats,
        }).$returningId();

        return {
          success: true,
          comparisonId: comparison.id,
          metricsComparison,
          winner,
          opportunities,
          threats,
        };
      }),

    // Get YouTube channel comparisons
    getYouTubeComparisons: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const comparisons = await db.select()
          .from(youtubeChannelComparisons)
          .where(eq(youtubeChannelComparisons.userId, ctx.user.id))
          .orderBy(desc(youtubeChannelComparisons.createdAt));

        return comparisons;
      }),

    // Generate AI insights for YouTube comparison
    generateYouTubeInsights: protectedProcedure
      .input(z.object({ comparisonId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [comparison] = await db.select()
          .from(youtubeChannelComparisons)
          .where(and(
            eq(youtubeChannelComparisons.id, input.comparisonId),
            eq(youtubeChannelComparisons.userId, ctx.user.id)
          ));

        if (!comparison) throw new Error("Comparison not found");

        const metrics = comparison.metricsComparison || [];
        const channelSummary = metrics.map((m: any) => 
          `${m.channelName}: ${formatCount(m.subscribers)} subscribers, ${formatCount(m.totalViews)} views, ${m.engagementRate.toFixed(2)}% engagement, posts ${m.postingFrequency}`
        ).join("\n");

        const prompt = `Analyze these YouTube channels and provide competitive insights:

${channelSummary}

Provide:
1. Key competitive advantages of each channel
2. Content strategy recommendations
3. Audience engagement insights
4. Growth opportunities
5. Potential threats to watch

Be specific and actionable.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a YouTube marketing strategist providing competitive analysis." },
            { role: "user", content: prompt }
          ]
        });

        const rawInsights = response.choices[0]?.message?.content;
        const insights = typeof rawInsights === 'string' ? rawInsights : "Unable to generate insights";

        await db.update(youtubeChannelComparisons)
          .set({ aiInsights: insights })
          .where(eq(youtubeChannelComparisons.id, input.comparisonId));

        return { success: true, insights };
      }),

    // Delete YouTube channel
    deleteYouTubeChannel: protectedProcedure
      .input(z.object({ channelDbId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(competitorYouTubeChannels)
          .where(and(
            eq(competitorYouTubeChannels.id, input.channelDbId),
            eq(competitorYouTubeChannels.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // ========================================
    // COMPETITOR ALERTS
    // ========================================

    // Create alert
    createAlert: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        name: z.string().min(1).max(255),
        alertType: z.enum([
          "new_content",
          "review_change",
          "rating_change",
          "price_change",
          "subscriber_milestone",
          "engagement_spike",
          "sentiment_shift",
          "keyword_mention",
          "custom"
        ]),
        threshold: z.number().optional(),
        thresholdType: z.enum(["absolute", "percentage"]).optional(),
        keywords: z.array(z.string()).optional(),
        frequency: z.enum(["realtime", "daily", "weekly"]).default("daily"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [alert] = await db.insert(competitorAlerts).values({
          userId: ctx.user.id,
          competitorId: input.competitorId,
          name: input.name,
          alertType: input.alertType,
          threshold: input.threshold,
          thresholdType: input.thresholdType,
          keywords: input.keywords,
          frequency: input.frequency,
          isEnabled: true,
        }).$returningId();

        return { success: true, alertId: alert.id };
      }),

    // Get alerts
    getAlerts: protectedProcedure
      .input(z.object({ competitorId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const conditions = [eq(competitorAlerts.userId, ctx.user.id)];
        if (input.competitorId) {
          conditions.push(eq(competitorAlerts.competitorId, input.competitorId));
        }

        const alerts = await db.select()
          .from(competitorAlerts)
          .where(and(...conditions))
          .orderBy(desc(competitorAlerts.createdAt));

        return alerts;
      }),

    // Toggle alert
    toggleAlert: protectedProcedure
      .input(z.object({ alertId: z.number(), isEnabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(competitorAlerts)
          .set({ isEnabled: input.isEnabled })
          .where(and(
            eq(competitorAlerts.id, input.alertId),
            eq(competitorAlerts.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Delete alert
    deleteAlert: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(competitorAlerts)
          .where(and(
            eq(competitorAlerts.id, input.alertId),
            eq(competitorAlerts.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Get alert history
    getAlertHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        unreadOnly: z.boolean().default(false),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const conditions = [eq(alertHistory.userId, ctx.user.id)];
        if (input.unreadOnly) {
          conditions.push(eq(alertHistory.isRead, false));
        }

        const history = await db.select()
          .from(alertHistory)
          .where(and(...conditions))
          .orderBy(desc(alertHistory.triggeredAt))
          .limit(input.limit);

        return history;
      }),

    // Get unread alert count
    getUnreadAlertCount: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return 0;
        if (!ctx.user) return 0;

        const result = await db.select({ count: sql<number>`count(*)` })
          .from(alertHistory)
          .where(and(
            eq(alertHistory.userId, ctx.user.id),
            eq(alertHistory.isRead, false)
          ));

        return result[0]?.count || 0;
      }),

    // Mark alert as read
    markAlertRead: protectedProcedure
      .input(z.object({ alertHistoryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(alertHistory)
          .set({ isRead: true })
          .where(and(
            eq(alertHistory.id, input.alertHistoryId),
            eq(alertHistory.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Mark all alerts as read
    markAllAlertsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(alertHistory)
          .set({ isRead: true })
          .where(and(
            eq(alertHistory.userId, ctx.user.id),
            eq(alertHistory.isRead, false)
          ));

        return { success: true };
      }),

    // Dismiss alert
    dismissAlert: protectedProcedure
      .input(z.object({ alertHistoryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.update(alertHistory)
          .set({ isDismissed: true, isRead: true })
          .where(and(
            eq(alertHistory.id, input.alertHistoryId),
            eq(alertHistory.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Trigger test alert (for testing purposes)
    triggerTestAlert: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [alert] = await db.select()
          .from(competitorAlerts)
          .where(and(
            eq(competitorAlerts.id, input.alertId),
            eq(competitorAlerts.userId, ctx.user.id)
          ));

        if (!alert) throw new Error("Alert not found");

        // Get competitor name
        const [competitor] = await db.select()
          .from(competitors)
          .where(eq(competitors.id, alert.competitorId));

        const competitorName = competitor?.name || "Unknown Competitor";

        // Create test alert history entry
        await db.insert(alertHistory).values({
          alertId: alert.id,
          userId: ctx.user.id,
          competitorId: alert.competitorId,
          alertType: alert.alertType,
          title: `Test Alert: ${alert.name}`,
          message: `This is a test alert for ${competitorName}. Alert type: ${alert.alertType}.`,
          isRead: false,
          isDismissed: false,
        });

        // Update last triggered
        await db.update(competitorAlerts)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(competitorAlerts.id, alert.id));

        return { success: true };
      }),

    // Check alerts (simulate checking for changes)
    checkAlerts: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get all enabled alerts for user
        const alerts = await db.select()
          .from(competitorAlerts)
          .where(and(
            eq(competitorAlerts.userId, ctx.user.id),
            eq(competitorAlerts.isEnabled, true)
          ));

        let triggeredCount = 0;

        // For demo purposes, randomly trigger some alerts
        for (const alert of alerts) {
          // 20% chance to trigger each alert for demo
          if (Math.random() < 0.2) {
            const [competitor] = await db.select()
              .from(competitors)
              .where(eq(competitors.id, alert.competitorId));

            const competitorName = competitor?.name || "Unknown Competitor";

            let title = "";
            let message = "";

            switch (alert.alertType) {
              case "new_content":
                title = `New Content from ${competitorName}`;
                message = `${competitorName} has published new content. Check their latest updates.`;
                break;
              case "review_change":
                title = `Review Activity for ${competitorName}`;
                message = `${competitorName} has received new reviews. Their average rating may have changed.`;
                break;
              case "subscriber_milestone":
                title = `Subscriber Milestone for ${competitorName}`;
                message = `${competitorName} has reached a new subscriber milestone.`;
                break;
              case "engagement_spike":
                title = `Engagement Spike for ${competitorName}`;
                message = `${competitorName} is experiencing higher than usual engagement.`;
                break;
              default:
                title = `Alert: ${alert.name}`;
                message = `Alert triggered for ${competitorName}.`;
            }

            await db.insert(alertHistory).values({
              alertId: alert.id,
              userId: ctx.user.id,
              competitorId: alert.competitorId,
              alertType: alert.alertType,
              title,
              message,
              isRead: false,
              isDismissed: false,
            });

            await db.update(competitorAlerts)
              .set({ lastCheckedAt: new Date(), lastTriggeredAt: new Date() })
              .where(eq(competitorAlerts.id, alert.id));

            triggeredCount++;
          } else {
            // Just update last checked
            await db.update(competitorAlerts)
              .set({ lastCheckedAt: new Date() })
              .where(eq(competitorAlerts.id, alert.id));
          }
        }

        return { success: true, alertsChecked: alerts.length, alertsTriggered: triggeredCount };
      }),

    // ========================================
    // CONTENT CALENDAR
    // ========================================

    // Add content to calendar
    addCalendarEntry: protectedProcedure
      .input(z.object({
        competitorId: z.number(),
        title: z.string().min(1).max(512),
        contentType: z.enum([
          "blog_post", "video", "podcast", "social_post", "ad",
          "landing_page", "email", "webinar", "case_study",
          "whitepaper", "product_launch", "event", "other"
        ]),
        url: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        publishedAt: z.string(), // ISO date string
        views: z.number().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        shares: z.number().optional(),
        topics: z.array(z.string()).optional(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const publishedDate = new Date(input.publishedAt);
        const dayOfWeek = publishedDate.getDay();
        const hourOfDay = publishedDate.getHours();

        // Calculate engagement rate if metrics provided
        let engagementRate = null;
        if (input.views && input.views > 0) {
          const totalEngagement = (input.likes || 0) + (input.comments || 0) + (input.shares || 0);
          engagementRate = (totalEngagement / input.views) * 100;
        }

        const [entry] = await db.insert(competitorContentCalendar).values({
          userId: ctx.user.id,
          competitorId: input.competitorId,
          title: input.title,
          contentType: input.contentType,
          url: input.url,
          thumbnailUrl: input.thumbnailUrl,
          publishedAt: publishedDate,
          dayOfWeek,
          hourOfDay,
          views: input.views,
          likes: input.likes,
          comments: input.comments,
          shares: input.shares,
          engagementRate: engagementRate?.toString(),
          topics: input.topics,
          sentiment: input.sentiment,
          notes: input.notes,
        }).$returningId();

        return { success: true, entryId: entry.id };
      }),

    // Get calendar entries
    getCalendarEntries: protectedProcedure
      .input(z.object({
        competitorId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        contentType: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const conditions = [eq(competitorContentCalendar.userId, ctx.user.id)];
        
        if (input.competitorId) {
          conditions.push(eq(competitorContentCalendar.competitorId, input.competitorId));
        }

        const entries = await db.select()
          .from(competitorContentCalendar)
          .where(and(...conditions))
          .orderBy(desc(competitorContentCalendar.publishedAt));

        // Filter by date range in JS if provided
        let filteredEntries = entries;
        if (input.startDate) {
          const start = new Date(input.startDate);
          filteredEntries = filteredEntries.filter(e => new Date(e.publishedAt) >= start);
        }
        if (input.endDate) {
          const end = new Date(input.endDate);
          filteredEntries = filteredEntries.filter(e => new Date(e.publishedAt) <= end);
        }
        if (input.contentType) {
          filteredEntries = filteredEntries.filter(e => e.contentType === input.contentType);
        }

        return filteredEntries;
      }),

    // Get calendar view data (organized by date)
    getCalendarView: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(), // 0-11
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return { entries: [], byDate: {} };
        if (!ctx.user) return { entries: [], byDate: {} };

        const startDate = new Date(input.year, input.month, 1);
        const endDate = new Date(input.year, input.month + 1, 0, 23, 59, 59);

        const entries = await db.select({
          entry: competitorContentCalendar,
          competitor: competitors,
        })
          .from(competitorContentCalendar)
          .leftJoin(competitors, eq(competitorContentCalendar.competitorId, competitors.id))
          .where(eq(competitorContentCalendar.userId, ctx.user.id))
          .orderBy(desc(competitorContentCalendar.publishedAt));

        // Filter by date range
        const filteredEntries = entries.filter(e => {
          const date = new Date(e.entry.publishedAt);
          return date >= startDate && date <= endDate;
        });

        // Organize by date
        const byDate: Record<string, typeof filteredEntries> = {};
        filteredEntries.forEach(entry => {
          const dateKey = new Date(entry.entry.publishedAt).toISOString().split('T')[0];
          if (!byDate[dateKey]) byDate[dateKey] = [];
          byDate[dateKey].push(entry);
        });

        return { entries: filteredEntries, byDate };
      }),

    // Analyze posting patterns
    analyzePostingPatterns: protectedProcedure
      .input(z.object({ competitorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get all calendar entries for this competitor
        const entries = await db.select()
          .from(competitorContentCalendar)
          .where(and(
            eq(competitorContentCalendar.userId, ctx.user.id),
            eq(competitorContentCalendar.competitorId, input.competitorId)
          ))
          .orderBy(desc(competitorContentCalendar.publishedAt));

        if (entries.length === 0) {
          return { success: false, message: "No content entries found for this competitor" };
        }

        // Calculate patterns
        const dayDistribution: Record<number, { count: number; totalEngagement: number }> = {};
        const hourDistribution: Record<number, { count: number; totalEngagement: number }> = {};
        const contentTypeDistribution: Record<string, { count: number; totalEngagement: number }> = {};

        for (let i = 0; i < 7; i++) dayDistribution[i] = { count: 0, totalEngagement: 0 };
        for (let i = 0; i < 24; i++) hourDistribution[i] = { count: 0, totalEngagement: 0 };

        entries.forEach(entry => {
          const engagement = parseFloat(entry.engagementRate || "0");
          
          // Day distribution
          if (entry.dayOfWeek !== null) {
            dayDistribution[entry.dayOfWeek].count++;
            dayDistribution[entry.dayOfWeek].totalEngagement += engagement;
          }
          
          // Hour distribution
          if (entry.hourOfDay !== null) {
            hourDistribution[entry.hourOfDay].count++;
            hourDistribution[entry.hourOfDay].totalEngagement += engagement;
          }
          
          // Content type distribution
          if (!contentTypeDistribution[entry.contentType]) {
            contentTypeDistribution[entry.contentType] = { count: 0, totalEngagement: 0 };
          }
          contentTypeDistribution[entry.contentType].count++;
          contentTypeDistribution[entry.contentType].totalEngagement += engagement;
        });

        // Find best performing times
        let bestDay = 0;
        let bestDayEngagement = 0;
        Object.entries(dayDistribution).forEach(([day, data]) => {
          const avgEngagement = data.count > 0 ? data.totalEngagement / data.count : 0;
          if (avgEngagement > bestDayEngagement) {
            bestDay = parseInt(day);
            bestDayEngagement = avgEngagement;
          }
        });

        let bestHour = 0;
        let bestHourEngagement = 0;
        Object.entries(hourDistribution).forEach(([hour, data]) => {
          const avgEngagement = data.count > 0 ? data.totalEngagement / data.count : 0;
          if (avgEngagement > bestHourEngagement) {
            bestHour = parseInt(hour);
            bestHourEngagement = avgEngagement;
          }
        });

        // Calculate posting frequency
        const dateRange = entries.length > 1 
          ? (new Date(entries[0].publishedAt).getTime() - new Date(entries[entries.length - 1].publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 7)
          : 1;
        const avgPostsPerWeek = entries.length / Math.max(dateRange, 1);
        const avgPostsPerMonth = avgPostsPerWeek * 4.33;

        // Generate recommendations
        const recommendations: string[] = [];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        recommendations.push(`Best posting day: ${dayNames[bestDay]} (avg ${bestDayEngagement.toFixed(2)}% engagement)`);
        recommendations.push(`Best posting hour: ${bestHour}:00 (avg ${bestHourEngagement.toFixed(2)}% engagement)`);
        recommendations.push(`Posting frequency: ${avgPostsPerWeek.toFixed(1)} posts/week`);

        // Find content gaps
        const contentGaps: { dayOfWeek?: number; hourOfDay?: number; contentType?: string; opportunity: string }[] = [];
        
        // Days with no posts
        Object.entries(dayDistribution).forEach(([day, data]) => {
          if (data.count === 0) {
            contentGaps.push({
              dayOfWeek: parseInt(day),
              opportunity: `No content posted on ${dayNames[parseInt(day)]} - consider testing this day`
            });
          }
        });

        // Format distributions for storage
        const formattedDayDist = Object.entries(dayDistribution).map(([day, data]) => ({
          day: parseInt(day),
          count: data.count,
          avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0
        }));

        const formattedHourDist = Object.entries(hourDistribution).map(([hour, data]) => ({
          hour: parseInt(hour),
          count: data.count,
          avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0
        }));

        const formattedContentTypeDist = Object.entries(contentTypeDistribution).map(([type, data]) => ({
          type,
          count: data.count,
          percentage: (data.count / entries.length) * 100,
          avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0
        }));

        // Save pattern analysis
        const [pattern] = await db.insert(postingPatterns).values({
          userId: ctx.user.id,
          competitorId: input.competitorId,
          avgPostsPerWeek: avgPostsPerWeek.toString(),
          avgPostsPerMonth: avgPostsPerMonth.toString(),
          bestDayOfWeek: bestDay,
          bestHourOfDay: bestHour,
          dayDistribution: formattedDayDist,
          hourDistribution: formattedHourDist,
          contentTypeDistribution: formattedContentTypeDist,
          contentGaps,
          recommendations,
          analyzedFrom: entries[entries.length - 1].publishedAt,
          analyzedTo: entries[0].publishedAt,
          contentCount: entries.length,
        }).$returningId();

        return {
          success: true,
          patternId: pattern.id,
          avgPostsPerWeek,
          avgPostsPerMonth,
          bestDay: dayNames[bestDay],
          bestHour,
          recommendations,
          contentGaps,
          dayDistribution: formattedDayDist,
          hourDistribution: formattedHourDist,
          contentTypeDistribution: formattedContentTypeDist,
        };
      }),

    // Get posting patterns
    getPostingPatterns: protectedProcedure
      .input(z.object({ competitorId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const [pattern] = await db.select()
          .from(postingPatterns)
          .where(and(
            eq(postingPatterns.userId, ctx.user.id),
            eq(postingPatterns.competitorId, input.competitorId)
          ))
          .orderBy(desc(postingPatterns.analyzedAt))
          .limit(1);

        return pattern || null;
      }),

    // Delete calendar entry
    deleteCalendarEntry: protectedProcedure
      .input(z.object({ entryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(competitorContentCalendar)
          .where(and(
            eq(competitorContentCalendar.id, input.entryId),
            eq(competitorContentCalendar.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // ========================================
    // AUTOMATED REPORTS
    // ========================================

    // Create report schedule
    createReportSchedule: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        reportType: z.enum([
          "weekly_summary", "monthly_summary", "quarterly_review",
          "competitor_deep_dive", "market_overview", "custom"
        ]),
        competitorIds: z.array(z.number()),
        frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        timeOfDay: z.string().optional(),
        emailEnabled: z.boolean().default(true),
        emailRecipients: z.array(z.string()).optional(),
        includeSections: z.array(z.string()).optional(),
        customPrompt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Calculate next run time
        const now = new Date();
        let nextRunAt = new Date();
        
        switch (input.frequency) {
          case "weekly":
            nextRunAt.setDate(now.getDate() + (7 - now.getDay() + (input.dayOfWeek || 1)) % 7);
            break;
          case "biweekly":
            nextRunAt.setDate(now.getDate() + 14);
            break;
          case "monthly":
            nextRunAt.setMonth(now.getMonth() + 1);
            nextRunAt.setDate(input.dayOfMonth || 1);
            break;
          case "quarterly":
            nextRunAt.setMonth(now.getMonth() + 3);
            nextRunAt.setDate(1);
            break;
        }

        if (input.timeOfDay) {
          const [hours, minutes] = input.timeOfDay.split(':').map(Number);
          nextRunAt.setHours(hours, minutes, 0, 0);
        }

        const [schedule] = await db.insert(reportSchedules).values({
          userId: ctx.user.id,
          name: input.name,
          reportType: input.reportType,
          competitorIds: input.competitorIds,
          frequency: input.frequency,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          timeOfDay: input.timeOfDay,
          emailEnabled: input.emailEnabled,
          emailRecipients: input.emailRecipients,
          includeSections: input.includeSections,
          customPrompt: input.customPrompt,
          status: "active",
          nextRunAt,
        }).$returningId();

        return { success: true, scheduleId: schedule.id, nextRunAt };
      }),

    // Get report schedules
    getReportSchedules: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const schedules = await db.select()
          .from(reportSchedules)
          .where(eq(reportSchedules.userId, ctx.user.id))
          .orderBy(desc(reportSchedules.createdAt));

        return schedules;
      }),

    // Update report schedule
    updateReportSchedule: protectedProcedure
      .input(z.object({
        scheduleId: z.number(),
        status: z.enum(["active", "paused", "completed"]).optional(),
        emailEnabled: z.boolean().optional(),
        emailRecipients: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const updates: Record<string, unknown> = {};
        if (input.status !== undefined) updates.status = input.status;
        if (input.emailEnabled !== undefined) updates.emailEnabled = input.emailEnabled;
        if (input.emailRecipients !== undefined) updates.emailRecipients = input.emailRecipients;

        await db.update(reportSchedules)
          .set(updates)
          .where(and(
            eq(reportSchedules.id, input.scheduleId),
            eq(reportSchedules.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Delete report schedule
    deleteReportSchedule: protectedProcedure
      .input(z.object({ scheduleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(reportSchedules)
          .where(and(
            eq(reportSchedules.id, input.scheduleId),
            eq(reportSchedules.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Generate report
    generateReport: protectedProcedure
      .input(z.object({
        reportType: z.enum([
          "weekly_summary", "monthly_summary", "quarterly_review",
          "competitor_deep_dive", "market_overview", "custom"
        ]),
        competitorIds: z.array(z.number()),
        title: z.string().optional(),
        customPrompt: z.string().optional(),
        scheduleId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        // Get competitors
        const competitorList = await db.select()
          .from(competitors)
          .where(and(
            eq(competitors.userId, ctx.user.id),
            sql`${competitors.id} IN (${input.competitorIds.join(',')})`
          ));

        if (competitorList.length === 0) {
          throw new Error("No competitors found");
        }

        // Create report record
        const reportTitle = input.title || `${input.reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${new Date().toLocaleDateString()}`;

        const [report] = await db.insert(competitorReports).values({
          userId: ctx.user.id,
          title: reportTitle,
          reportType: input.reportType,
          competitorIds: input.competitorIds,
          scheduleId: input.scheduleId,
          isScheduled: !!input.scheduleId,
          status: "generating",
        }).$returningId();

        // Gather metrics snapshot
        const metricsSnapshot = competitorList.map(c => ({
          competitorId: c.id,
          competitorName: c.name,
          metrics: {
            website: c.website || "N/A",
            industry: c.industry || "N/A",
            employeeCount: c.employeeCount || "N/A",
            fundingStage: c.fundingStage || "N/A",
            estimatedRevenue: c.estimatedRevenue || "N/A",
          }
        }));

        // Generate SWOT analysis
        const allStrengths: string[] = [];
        const allWeaknesses: string[] = [];
        const allOpportunities: string[] = [];
        const allThreats: string[] = [];

        competitorList.forEach(c => {
          if (c.strengths) allStrengths.push(...(c.strengths as string[]));
          if (c.weaknesses) allWeaknesses.push(...(c.weaknesses as string[]));
          if (c.opportunities) allOpportunities.push(...(c.opportunities as string[]));
          if (c.threats) allThreats.push(...(c.threats as string[]));
        });

        const swotAnalysis = {
          strengths: Array.from(new Set(allStrengths)).slice(0, 5),
          weaknesses: Array.from(new Set(allWeaknesses)).slice(0, 5),
          opportunities: Array.from(new Set(allOpportunities)).slice(0, 5),
          threats: Array.from(new Set(allThreats)).slice(0, 5),
        };

        // Generate AI executive summary
        const competitorSummary = competitorList.map(c => 
          `${c.name}: ${c.industry || 'Unknown industry'}, ${c.employeeCount || 'Unknown'} employees, ${c.estimatedRevenue || 'Unknown revenue'}`
        ).join('\n');

        const aiPrompt = input.customPrompt || `Generate an executive summary for a competitive analysis report covering these competitors:

${competitorSummary}

Provide:
1. Key market trends
2. Competitive positioning insights
3. Strategic recommendations
4. Risk factors to monitor

Keep it concise and actionable.`;

        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a competitive intelligence analyst. Generate concise, actionable insights." },
            { role: "user", content: aiPrompt }
          ]
        });

        const executiveSummary = typeof aiResponse.choices[0]?.message?.content === 'string' 
          ? aiResponse.choices[0].message.content 
          : "Unable to generate executive summary";

        // Extract key findings and recommendations
        const keyFindings = [
          `Analyzed ${competitorList.length} competitors`,
          `Primary industries: ${Array.from(new Set(competitorList.map(c => c.industry).filter(Boolean))).join(', ') || 'Various'}`,
          `Report type: ${input.reportType.replace(/_/g, ' ')}`,
        ];

        const recommendations = [
          "Monitor competitor content publishing patterns",
          "Track pricing changes across competitors",
          "Analyze customer sentiment trends",
          "Identify content gaps for differentiation",
        ];

        // Build report sections
        const sections = [
          {
            id: "executive-summary",
            title: "Executive Summary",
            type: "summary" as const,
            content: executiveSummary,
          },
          {
            id: "competitor-overview",
            title: "Competitor Overview",
            type: "metrics" as const,
            content: `Overview of ${competitorList.length} tracked competitors.`,
            data: { competitors: metricsSnapshot },
          },
          {
            id: "swot-analysis",
            title: "SWOT Analysis",
            type: "swot" as const,
            content: "Aggregated SWOT analysis across all competitors.",
            data: swotAnalysis,
          },
          {
            id: "recommendations",
            title: "Strategic Recommendations",
            type: "recommendations" as const,
            content: recommendations.join('\n'),
          },
        ];

        // Update report with generated content
        await db.update(competitorReports)
          .set({
            sections,
            executiveSummary,
            keyFindings,
            recommendations,
            metricsSnapshot,
            swotAnalysis,
            status: "completed",
            generatedAt: new Date(),
          })
          .where(eq(competitorReports.id, report.id));

        // Update schedule if this was a scheduled report
        if (input.scheduleId) {
          await db.update(reportSchedules)
            .set({
              lastRunAt: new Date(),
              runCount: sql`${reportSchedules.runCount} + 1`,
            })
            .where(eq(reportSchedules.id, input.scheduleId));
        }

        return {
          success: true,
          reportId: report.id,
          title: reportTitle,
          executiveSummary,
          keyFindings,
          recommendations,
          swotAnalysis,
          metricsSnapshot,
          sections,
        };
      }),

    // Get reports
    getReports: protectedProcedure
      .input(z.object({
        reportType: z.string().optional(),
        limit: z.number().default(20),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        if (!ctx.user) return [];

        const conditions = [eq(competitorReports.userId, ctx.user.id)];

        const reports = await db.select()
          .from(competitorReports)
          .where(and(...conditions))
          .orderBy(desc(competitorReports.createdAt))
          .limit(input.limit);

        return reports;
      }),

    // Get single report
    getReport: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        if (!ctx.user) return null;

        const [report] = await db.select()
          .from(competitorReports)
          .where(and(
            eq(competitorReports.id, input.reportId),
            eq(competitorReports.userId, ctx.user.id)
          ));

        return report || null;
      }),

    // Delete report
    deleteReport: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        await db.delete(competitorReports)
          .where(and(
            eq(competitorReports.id, input.reportId),
            eq(competitorReports.userId, ctx.user.id)
          ));

        return { success: true };
      }),

    // Export report as markdown
    exportReportMarkdown: protectedProcedure
      .input(z.object({ reportId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (!ctx.user) throw new Error("Not authenticated");

        const [report] = await db.select()
          .from(competitorReports)
          .where(and(
            eq(competitorReports.id, input.reportId),
            eq(competitorReports.userId, ctx.user.id)
          ));

        if (!report) throw new Error("Report not found");

        // Build markdown content
        let markdown = `# ${report.title}\n\n`;
        markdown += `**Generated:** ${report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}\n`;
        markdown += `**Report Type:** ${report.reportType?.replace(/_/g, ' ')}\n\n`;
        markdown += `---\n\n`;

        // Executive Summary
        if (report.executiveSummary) {
          markdown += `## Executive Summary\n\n${report.executiveSummary}\n\n`;
        }

        // Key Findings
        if (report.keyFindings && (report.keyFindings as string[]).length > 0) {
          markdown += `## Key Findings\n\n`;
          (report.keyFindings as string[]).forEach((finding, i) => {
            markdown += `${i + 1}. ${finding}\n`;
          });
          markdown += `\n`;
        }

        // SWOT Analysis
        if (report.swotAnalysis) {
          const swot = report.swotAnalysis as { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
          markdown += `## SWOT Analysis\n\n`;
          markdown += `### Strengths\n${swot.strengths?.map(s => `- ${s}`).join('\n') || 'None identified'}\n\n`;
          markdown += `### Weaknesses\n${swot.weaknesses?.map(w => `- ${w}`).join('\n') || 'None identified'}\n\n`;
          markdown += `### Opportunities\n${swot.opportunities?.map(o => `- ${o}`).join('\n') || 'None identified'}\n\n`;
          markdown += `### Threats\n${swot.threats?.map(t => `- ${t}`).join('\n') || 'None identified'}\n\n`;
        }

        // Recommendations
        if (report.recommendations && (report.recommendations as string[]).length > 0) {
          markdown += `## Strategic Recommendations\n\n`;
          (report.recommendations as string[]).forEach((rec, i) => {
            markdown += `${i + 1}. ${rec}\n`;
          });
          markdown += `\n`;
        }

        // Competitor Metrics
        if (report.metricsSnapshot && (report.metricsSnapshot as any[]).length > 0) {
          markdown += `## Competitor Metrics\n\n`;
          markdown += `| Competitor | Website | Industry | Employees | Revenue |\n`;
          markdown += `|------------|---------|----------|-----------|---------|\n`;
          (report.metricsSnapshot as any[]).forEach(m => {
            markdown += `| ${m.competitorName} | ${m.metrics.website} | ${m.metrics.industry} | ${m.metrics.employeeCount} | ${m.metrics.estimatedRevenue} |\n`;
          });
          markdown += `\n`;
        }

        markdown += `---\n\n*Report generated by YouTube Playlist Analyzer*\n`;

        return { markdown, title: report.title };
      }),
  }),
});

export type AppRouter = typeof appRouter;
