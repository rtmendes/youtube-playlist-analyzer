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
import { playlists, analysisSessions, projects, folders, tags, projectTags, commentInsights, generatedAssets } from "../drizzle/schema";
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
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional() }))
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
});

export type AppRouter = typeof appRouter;
