import { describe, it, expect } from "vitest";

// Test the URL parsing logic for bulk processing
describe("Bulk URL Processing", () => {
  // Helper function to parse bulk URLs (mirrors frontend logic)
  const parseBulkUrls = (input: string): string[] => {
    return input.split("\n").filter(line => line.trim().length > 0);
  };

  it("should parse multiple URLs separated by newlines", () => {
    const input = `https://youtube.com/playlist?list=PLxxxxx
https://youtube.com/watch?v=xxxxx
https://youtube.com/playlist?list=PLyyyyy`;
    
    const urls = parseBulkUrls(input);
    
    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe("https://youtube.com/playlist?list=PLxxxxx");
    expect(urls[1]).toBe("https://youtube.com/watch?v=xxxxx");
    expect(urls[2]).toBe("https://youtube.com/playlist?list=PLyyyyy");
  });

  it("should filter out empty lines", () => {
    const input = `https://youtube.com/watch?v=abc123

https://youtube.com/watch?v=def456

`;
    
    const urls = parseBulkUrls(input);
    
    expect(urls).toHaveLength(2);
  });

  it("should handle single URL input", () => {
    const input = "https://youtube.com/playlist?list=PLtest";
    
    const urls = parseBulkUrls(input);
    
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe("https://youtube.com/playlist?list=PLtest");
  });

  it("should return empty array for empty input", () => {
    const input = "";
    
    const urls = parseBulkUrls(input);
    
    expect(urls).toHaveLength(0);
  });

  it("should handle whitespace-only lines", () => {
    const input = `https://youtube.com/watch?v=test1
   
https://youtube.com/watch?v=test2`;
    
    const urls = parseBulkUrls(input);
    
    expect(urls).toHaveLength(2);
  });
});

// Test CSV export formatting
describe("CSV Export Formatting", () => {
  // Helper to escape CSV values
  const escapeCSV = (value: string): string => {
    return `"${value.replace(/"/g, '""')}"`;
  };

  it("should escape double quotes in CSV values", () => {
    const text = 'This is a "quoted" comment';
    const escaped = escapeCSV(text);
    
    expect(escaped).toBe('"This is a ""quoted"" comment"');
  });

  it("should handle text with multiple quotes", () => {
    const text = '"Hello" said "World"';
    const escaped = escapeCSV(text);
    
    expect(escaped).toBe('"""Hello"" said ""World"""');
  });

  it("should handle text without quotes", () => {
    const text = "Simple comment text";
    const escaped = escapeCSV(text);
    
    expect(escaped).toBe('"Simple comment text"');
  });

  it("should handle empty strings", () => {
    const text = "";
    const escaped = escapeCSV(text);
    
    expect(escaped).toBe('""');
  });
});

// Test video data structure
describe("Video Data Structure", () => {
  interface Video {
    id: string;
    title: string;
    channelTitle: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    durationFormatted: string;
    publishedAt: string;
    playlistTitle?: string;
  }

  const createVideoCSVRow = (video: Video): string[] => {
    return [
      video.id,
      `"${video.title.replace(/"/g, '""')}"`,
      `"${video.channelTitle.replace(/"/g, '""')}"`,
      String(video.viewCount),
      String(video.likeCount),
      String(video.commentCount),
      video.durationFormatted,
      new Date(video.publishedAt).toISOString().split("T")[0],
      video.playlistTitle ? `"${video.playlistTitle.replace(/"/g, '""')}"` : "",
    ];
  };

  it("should create correct CSV row for video", () => {
    const video: Video = {
      id: "abc123",
      title: "Test Video Title",
      channelTitle: "Test Channel",
      viewCount: 1000000,
      likeCount: 50000,
      commentCount: 2500,
      durationFormatted: "10:30",
      publishedAt: "2024-01-15T12:00:00Z",
      playlistTitle: "My Playlist",
    };

    const row = createVideoCSVRow(video);

    expect(row[0]).toBe("abc123");
    expect(row[1]).toBe('"Test Video Title"');
    expect(row[2]).toBe('"Test Channel"');
    expect(row[3]).toBe("1000000");
    expect(row[4]).toBe("50000");
    expect(row[5]).toBe("2500");
    expect(row[6]).toBe("10:30");
    expect(row[7]).toBe("2024-01-15");
    expect(row[8]).toBe('"My Playlist"');
  });

  it("should handle video without playlist", () => {
    const video: Video = {
      id: "xyz789",
      title: "Single Video",
      channelTitle: "Channel",
      viewCount: 500,
      likeCount: 25,
      commentCount: 10,
      durationFormatted: "5:00",
      publishedAt: "2024-06-01T00:00:00Z",
    };

    const row = createVideoCSVRow(video);

    expect(row[8]).toBe("");
  });

  it("should escape special characters in title", () => {
    const video: Video = {
      id: "test",
      title: 'Video with "quotes" and special chars',
      channelTitle: "Channel",
      viewCount: 100,
      likeCount: 10,
      commentCount: 5,
      durationFormatted: "1:00",
      publishedAt: "2024-01-01T00:00:00Z",
    };

    const row = createVideoCSVRow(video);

    expect(row[1]).toBe('"Video with ""quotes"" and special chars"');
  });
});

// Test comment data structure
describe("Comment Data Structure", () => {
  interface Comment {
    id: string;
    videoId: string;
    videoTitle?: string;
    authorDisplayName: string;
    textOriginal: string;
    likeCount: number;
    replyCount: number;
    publishedAt: string;
  }

  const createCommentCSVRow = (comment: Comment): string[] => {
    return [
      comment.id,
      comment.videoId,
      `"${(comment.videoTitle || "").replace(/"/g, '""')}"`,
      `"${comment.authorDisplayName.replace(/"/g, '""')}"`,
      `"${comment.textOriginal.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      String(comment.likeCount),
      String(comment.replyCount),
      new Date(comment.publishedAt).toISOString().split("T")[0],
    ];
  };

  it("should create correct CSV row for comment", () => {
    const comment: Comment = {
      id: "comment123",
      videoId: "video456",
      videoTitle: "Test Video",
      authorDisplayName: "John Doe",
      textOriginal: "This is a great video!",
      likeCount: 100,
      replyCount: 5,
      publishedAt: "2024-03-15T10:30:00Z",
    };

    const row = createCommentCSVRow(comment);

    expect(row[0]).toBe("comment123");
    expect(row[1]).toBe("video456");
    expect(row[2]).toBe('"Test Video"');
    expect(row[3]).toBe('"John Doe"');
    expect(row[4]).toBe('"This is a great video!"');
    expect(row[5]).toBe("100");
    expect(row[6]).toBe("5");
    expect(row[7]).toBe("2024-03-15");
  });

  it("should replace newlines with spaces in comment text", () => {
    const comment: Comment = {
      id: "c1",
      videoId: "v1",
      authorDisplayName: "User",
      textOriginal: "Line 1\nLine 2\nLine 3",
      likeCount: 0,
      replyCount: 0,
      publishedAt: "2024-01-01T00:00:00Z",
    };

    const row = createCommentCSVRow(comment);

    expect(row[4]).toBe('"Line 1 Line 2 Line 3"');
  });

  it("should handle comment without video title", () => {
    const comment: Comment = {
      id: "c2",
      videoId: "v2",
      authorDisplayName: "User",
      textOriginal: "Comment text",
      likeCount: 5,
      replyCount: 0,
      publishedAt: "2024-01-01T00:00:00Z",
    };

    const row = createCommentCSVRow(comment);

    expect(row[2]).toBe('""');
  });
});

// Test number formatting
describe("Number Formatting", () => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  it("should format millions correctly", () => {
    expect(formatNumber(1000000)).toBe("1.0M");
    expect(formatNumber(2500000)).toBe("2.5M");
    expect(formatNumber(10000000)).toBe("10.0M");
  });

  it("should format thousands correctly", () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(5500)).toBe("5.5K");
    expect(formatNumber(999000)).toBe("999.0K");
  });

  it("should not format numbers under 1000", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(500)).toBe("500");
    expect(formatNumber(999)).toBe("999");
  });
});
