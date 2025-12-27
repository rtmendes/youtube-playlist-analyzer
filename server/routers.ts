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
import { playlists, analysisSessions, projects, folders, tags, projectTags, commentInsights, generatedAssets, amazonProducts, amazonReviews, redditPosts, redditComments, researchSessions, multiSourceInsights, savedPlaylists, playlistRuns, playlistVideos, videos, comments } from "../drizzle/schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { parseAmazonUrl, generateSampleProduct, generateSampleReviews, calculateReviewStats, analyzeReviewSentiment, fetchAmazonProduct, fetchAmazonReviews, searchAmazonProducts, compareProducts, AmazonApiConfig } from "./amazon";
import { parseRedditUrl, fetchSubredditPosts, searchReddit, fetchPostComments, analyzeRedditComment, calculateRedditStats, getPopularResearchSubreddits } from "./reddit";

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
        const result = await fetchSubredditPosts(
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
        const result = await searchReddit(
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
        const result = await fetchPostComments(
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
});

export type AppRouter = typeof appRouter;
