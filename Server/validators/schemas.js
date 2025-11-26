const { z } = require("zod");

/**
 * Validation Schemas using Zod
 * Provides type-safe runtime validation for all API endpoints
 */

// ========== Common Schemas ============

// UUID v4 format validator (used for PostgreSQL database IDs)
const uuidSchema = z.string().uuid("Invalid UUID format");

// Kept for backward compatibility if needed
const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const sortSchema = z.object({
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "author", "uploadedAt", "fileSize"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ============== Book Schemas ==================

const bookQuerySchema = paginationSchema.merge(sortSchema).extend({
  fileType: z.enum(["pdf", "epub", "txt", "all"]).optional(),
  search: z.string().max(500).optional(),
  author: z.string().max(200).optional(),
  readStatus: z.enum(["unread", "reading", "completed"]).optional(),
  collectionId: uuidSchema.optional(),
});

const bookIdParamSchema = z.object({
  id: uuidSchema,
});

const updateBookSchema = z.object({
  title: z.string().min(1).max(500).optional().nullable(),
  author: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  status: z
    .enum(["unread", "reading", "read", "want-to-read"])
    .optional()
    .nullable(),
  progress: z.number().int().min(0).max(100).optional().nullable(),
  currentPage: z.number().int().min(0).optional().nullable(),
  totalPages: z.number().int().min(0).optional().nullable(),
  genre: z.array(z.string().max(100)).max(20).optional().nullable(),
  publicationYear: z.number().int().min(1000).max(2100).optional().nullable(),
  isbn: z.string().max(20).optional().nullable(),
  publisher: z.string().max(200).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
});

const presignedUrlQuerySchema = z.object({
  expiresIn: z.coerce.number().int().min(60).max(604800).default(3600), // 1 minute to 7 days
});

// ============== Bookmark Schemas ===============

const createBookmarkSchema = z.object({
  bookId: uuidSchema,
  pageNumber: z.number().int().min(0),
  cfi: z.string().max(1000).optional(),
  progress: z.number().min(0).max(100).optional(),
  note: z.string().max(1000).optional(),
  title: z.string().max(200).optional(),
});

const updateBookmarkSchema = z.object({
  pageNumber: z.number().int().min(0).optional(),
  cfi: z.string().max(1000).optional(),
  progress: z.number().min(0).max(100).optional(),
  note: z.string().max(1000).optional(),
  title: z.string().max(200).optional(),
});

const bookmarkIdParamSchema = z.object({
  id: uuidSchema,
});

// =============== Highlight Schemas ===================

const createHighlightSchema = z.object({
  bookId: uuidSchema,
  text: z.string().min(1).max(10000),
  cfiRange: z.string().max(1000).optional().nullable(),
  pageNumber: z.number().int().min(0).optional().nullable(),
  rects: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
    )
    .optional()
    .nullable(),
  color: z
    .enum(["yellow", "green", "blue", "pink", "purple", "orange"])
    .default("yellow"),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  note: z.string().max(5000).optional().nullable(),
  source: z.enum(["EPUB", "PDF", "TXT"]).default("EPUB"),
});

const updateHighlightSchema = z.object({
  text: z.string().min(1).max(10000).optional(),
  color: z
    .enum(["yellow", "green", "blue", "pink", "purple", "orange"])
    .optional(),
  hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  note: z.string().max(5000).optional(),
  cfiRange: z.string().max(1000).optional(),
  pageNumber: z.number().int().min(0).optional(),
  source: z.enum(["EPUB", "PDF", "TXT"]).optional(),
});

const highlightIdParamSchema = z.object({
  highlightId: uuidSchema,
});

const highlightBookIdParamSchema = z.object({
  bookId: uuidSchema,
});

const highlightSearchQuerySchema = z.object({
  q: z.string().min(1).max(500),
});

const highlightFilterQuerySchema = z.object({
  colors: z
    .string()
    .regex(
      /^(yellow|green|blue|pink|purple|orange)(,(yellow|green|blue|pink|purple|orange))*$/,
      "Invalid color filter format"
    ),
});

// ================ Collection Schemas =================

const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional().default(false),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
});

const collectionIdParamSchema = z.object({
  id: uuidSchema,
});

const addBookToCollectionSchema = z.object({
  bookId: uuidSchema,
});

// =============== Analytics Schemas ==================

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(["day", "week", "month", "year"]).optional().default("month"),
});

const readingSessionSchema = z.object({
  bookId: uuidSchema,
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  pagesRead: z.number().int().min(0).optional(),
  startPage: z.number().int().min(0).optional(),
  endPage: z.number().int().min(0).optional(),
});

// ============== Upload Schemas =================

const uploadQuerySchema = z.object({
  skipCoverGeneration: z.enum(["true", "false"]).optional(),
});

// =============== Export all schemas ==============

module.exports = {
  // Common
  mongoIdSchema,
  uuidSchema,
  paginationSchema,
  sortSchema,

  // Books
  bookQuerySchema,
  bookIdParamSchema,
  updateBookSchema,
  presignedUrlQuerySchema,

  // Bookmarks
  createBookmarkSchema,
  updateBookmarkSchema,
  bookmarkIdParamSchema,

  // Highlights
  createHighlightSchema,
  updateHighlightSchema,
  highlightIdParamSchema,
  highlightBookIdParamSchema,
  highlightSearchQuerySchema,
  highlightFilterQuerySchema,

  // Collections
  createCollectionSchema,
  updateCollectionSchema,
  collectionIdParamSchema,
  addBookToCollectionSchema,

  // Analytics
  analyticsQuerySchema,
  readingSessionSchema,

  // Upload
  uploadQuerySchema,
};
