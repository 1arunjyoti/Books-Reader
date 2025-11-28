✅Documented on November 9, 2025.

# BooksReader API Endpoints Documentation

Complete reference guide for all API endpoints used by the BooksReader Client application.

**Base URL**: `http://localhost:3001/api` (or configured `NEXT_PUBLIC_API_URL`)

**Authentication**: All endpoints require Bearer token in Authorization header

````
Authorization: Bearer <access_token>
Endpoints for managing user's book library, metadata, and file access.

### Get All Books

**Endpoint**: `GET /api/books`

**Description**: Fetch all books for the authenticated user with optional filtering, searching, and sorting.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in title, author, and metadata |
| `status` | string | No | Filter by status: `to-read`, `reading`, `completed` |
| `genre` | string | No | Filter by genre (comma-separated) |
| `format` | string | No | Filter by format: `pdf`, `epub`, `txt` (comma-separated) |
| `language` | string | No | Filter by language code (e.g., `en`, `es`) |
| `dateFrom` | string | No | Filter books uploaded after date (ISO 8601) |
| `dateTo` | string | No | Filter books uploaded before date (ISO 8601) |
| `sortBy` | string | No | Sort by: `title`, `author`, `uploadedAt`, `updatedAt`, `currentPage` |
| `sortOrder` | string | No | Sort order: `asc`, `desc` (default: `asc`) |

**Example Request**:
```bash
GET /api/books?search=harry&status=reading&format=pdf,epub&sortBy=updatedAt&sortOrder=desc
Authorization: Bearer <access_token>
````

**Example Response** (200 OK):

```json
{
  "books": [
    {
      "id": "book-123",
      "title": "Harry Potter",
      "author": "J.K. Rowling",
      "fileName": "hp1_xyz.pdf",
      "originalName": "Harry Potter and the Philosophers Stone.pdf",
      "fileUrl": "https://b2-cdn.example.com/file",
      "fileId": "file-123",
      "fileSize": 5242880,
      "fileType": "pdf",
      "userId": "user-123",
      "coverUrl": "https://b2-cdn.example.com/cover.jpg",
      "status": "reading",
      "progress": 45,
      "currentPage": 234,
      "totalPages": 523,
      "uploadedAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:22:00Z",
      "lastReadAt": "2024-01-20T14:22:00Z",
      "description": "A magical journey begins...",
      "genre": ["Fantasy", "Young Adult"],
      "publicationYear": 1997,
      "isbn": "978-0747532699",
      "publisher": "Bloomsbury",
      "language": "en"
    }
  ]
}
```

**Error Responses**:

- `400 Bad Request`: Invalid filter parameters
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

### Get Single Book

**Endpoint**: `GET /api/books/:id`

**Description**: Fetch metadata for a specific book.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book ID |

**Example Request**:

```bash
GET /api/books/book-123
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "book": {
    "id": "book-123",
    "title": "Harry Potter",
    "author": "J.K. Rowling",
    "fileType": "pdf",
    "status": "reading",
    "progress": 45,
    "currentPage": 234,
    "totalPages": 523,
    "uploadedAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized to access this book
- `500 Internal Server Error`: Server error

---

### Update Book Metadata

**Endpoint**: `PATCH /api/books/:id`

**Description**: Update book metadata including title, author, status, progress, and reading position.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book ID |

**Request Body**:

```typescript
{
  title?: string;                      // Book title
  author?: string | null;              // Author name
  status?: string;                     // "to-read" | "reading" | "completed"
  progress?: number;                   // 0-100
  currentPage?: number;                // Current page number
  totalPages?: number;                 // Total pages in book
  description?: string | null;         // Book description
  genre?: string[];                    // Array of genres
  publicationYear?: number | null;     // Year published
  isbn?: string | null;                // ISBN number
  publisher?: string | null;           // Publisher name
  language?: string | null;            // Language code (e.g., "en", "es")
}
```

**Example Request**:

```bash
PATCH /api/books/book-123
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "status": "reading",
  "progress": 45,
  "currentPage": 234,
  "totalPages": 523,
  "author": "J.K. Rowling",
  "genre": ["Fantasy", "Young Adult"],
  "language": "en"
}
```

**Example Response** (200 OK):

```json
{
  "book": {
    "id": "book-123",
    "title": "Harry Potter",
    "author": "J.K. Rowling",
    "status": "reading",
    "progress": 45,
    "currentPage": 234,
    "totalPages": 523,
    "genre": ["Fantasy", "Young Adult"],
    "language": "en",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid data format
- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Delete Book

**Endpoint**: `DELETE /api/books/:id`

**Description**: Delete a book from the library and remove associated file from storage.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book ID |

**Example Request**:

```bash
DELETE /api/books/book-123
Authorization: Bearer <access_token>
```

**Example Response** (204 No Content):

```
(empty body)
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get Presigned URL

**Endpoint**: `GET /api/books/:id/presigned-url`

**Description**: Get a presigned URL to access the book file from Backblaze B2 storage. URLs are time-limited for security.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expiresIn` | number | No | Expiration time in seconds (default: 3600, max: 604800 = 7 days) |

**Example Request**:

```bash
GET /api/books/book-123/presigned-url?expiresIn=604800
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "presignedUrl": "https://s3.us-west-004.backblazeb2.com/bucket/file.pdf?auth=xyz&expires=1234567890"
}
```

**Usage Notes**:

- URLs are cached on the client for 7 days to avoid regeneration
- Maximum expiration: 604800 seconds (7 days)
- Each call generates a new URL; avoid calling repeatedly

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `400 Bad Request`: Invalid expiresIn value
- `500 Internal Server Error`: Storage service error

---

### Bulk Delete Books

**Endpoint**: `POST /api/books/bulk-delete`

**Description**: Delete multiple books at once.

**Request Body**:

```typescript
{
  bookIds: string[];    // Array of book IDs to delete
}
```

**Example Request**:

```bash
POST /api/books/bulk-delete
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookIds": ["book-123", "book-124"]
}
```

**Example Response** (200 OK):

```json
{
  "message": "Books deleted successfully",
  "count": 2
}
```

**Error Responses**:

- `400 Bad Request`: Invalid book IDs
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Upload Custom Cover

**Endpoint**: `POST /api/books/:id/cover`

**Description**: Upload a custom cover image for a book.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book ID |

**Request Format**: `multipart/form-data`

**Form Fields**:

- `cover`: Image file (JPEG, PNG, WebP)

**Example Request**:

```bash
POST /api/books/book-123/cover
Authorization: Bearer <access_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="cover"; filename="cover.jpg"
Content-Type: image/jpeg

(binary data)
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Example Response** (200 OK):

```json
{
  "message": "Cover updated successfully",
  "coverUrl": "https://b2-cdn.example.com/new-cover.jpg"
}
```

**Error Responses**:

- `400 Bad Request`: Invalid file or missing cover
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Generate Cover

**Endpoint**: `POST /api/books/:id/generate-cover`

**Description**: Trigger generation of a cover image for a book (if missing or failed).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Book ID |

**Example Request**:

```bash
POST /api/books/book-123/generate-cover
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "message": "Cover generation started"
}
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

## Bookmarks API

Endpoints for managing page bookmarks within books.

### Create Bookmark

**Endpoint**: `POST /api/bookmarks`

**Description**: Create a new bookmark at a specific page in a book.

**Request Body**:

```typescript
{
  bookId: string;          // Book ID
  pageNumber: number;      // Page number to bookmark
  note?: string;           // Optional note/annotation
}
```

**Example Request**:

```bash
POST /api/bookmarks
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookId": "book-123",
  "pageNumber": 234,
  "note": "Interesting plot twist here"
}
```

**Example Response** (201 Created):

```json
{
  "bookmark": {
    "id": "bm-123",
    "bookId": "book-123",
    "userId": "user-123",
    "pageNumber": 234,
    "note": "Interesting plot twist here",
    "createdAt": "2024-01-20T14:22:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Missing required fields or invalid page number
- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get All Bookmarks for a Book

**Endpoint**: `GET /api/bookmarks/:bookId`

**Description**: Fetch all bookmarks for a specific book.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book ID |

**Example Request**:

```bash
GET /api/bookmarks/book-123
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "bookmarks": [
    {
      "id": "bm-123",
      "bookId": "book-123",
      "userId": "user-123",
      "pageNumber": 234,
      "note": "Interesting plot twist here",
      "createdAt": "2024-01-20T14:22:00Z",
      "updatedAt": "2024-01-20T14:22:00Z"
    },
    {
      "id": "bm-124",
      "bookId": "book-123",
      "userId": "user-123",
      "pageNumber": 345,
      "note": "Important character death",
      "createdAt": "2024-01-21T10:15:00Z",
      "updatedAt": "2024-01-21T10:15:00Z"
    }
  ]
}
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Update Bookmark

**Endpoint**: `PATCH /api/bookmarks/:id`

**Description**: Update bookmark note or other properties.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Bookmark ID |

**Request Body**:

```typescript
{
  note?: string;           // Update the note
}
```

**Example Request**:

```bash
PATCH /api/bookmarks/bm-123
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "note": "Updated note - very important!"
}
```

**Example Response** (200 OK):

```json
{
  "bookmark": {
    "id": "bm-123",
    "bookId": "book-123",
    "pageNumber": 234,
    "note": "Updated note - very important!",
    "updatedAt": "2024-01-20T15:00:00Z"
  }
}
```

**Error Responses**:

- `404 Not Found`: Bookmark not found
- `401 Unauthorized`: Not authorized
- `400 Bad Request`: Invalid data
- `500 Internal Server Error`: Server error

---

### Delete Bookmark

**Endpoint**: `DELETE /api/bookmarks/:id`

**Description**: Delete a bookmark.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Bookmark ID |

**Example Request**:

```bash
DELETE /api/bookmarks/bm-123
Authorization: Bearer <access_token>
```

**Example Response** (204 No Content):

```
(empty body)
```

**Error Responses**:

- `404 Not Found`: Bookmark not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

## Highlights API

Endpoints for managing text highlights and annotations within books.

### Create Highlight

**Endpoint**: `POST /api/highlights`

**Description**: Create a new highlight on text in a book.

**Request Body**:

```typescript
{
  bookId: string;                          // Book ID
  text: string;                            // Highlighted text
  color: string;                           // Color name (e.g., "yellow", "blue")
  hex: string;                             // Hex color code (e.g., "#FFFF00")
  note?: string;                           // Optional annotation
  cfiRange?: string;                       // EPUB: Canonical Fragment Identifier
  pageNumber?: number;                     // PDF/TXT: Page number
  rects?: PdfHighlightRect[];              // PDF: Bounding rectangles
  boundingRect?: PdfHighlightRect;         // PDF: Overall bounding rectangle
  source?: "pdf" | "epub" | "txt";         // Document type
}
```

**Example Request (PDF)**:

```bash
POST /api/highlights
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookId": "book-123",
  "text": "The quick brown fox jumps over the lazy dog",
  "color": "yellow",
  "hex": "#FFFF00",
  "note": "Important phrase",
  "pageNumber": 5,
  "rects": [
    {
      "x": 100,
      "y": 200,
      "width": 300,
      "height": 20
    }
  ],
  "boundingRect": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 20
  },
  "source": "pdf"
}
```

**Example Request (EPUB)**:

```bash
POST /api/highlights
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookId": "book-124",
  "text": "Once upon a time",
  "color": "blue",
  "hex": "#0000FF",
  "note": "Story begins",
  "cfiRange": "epubcfi(/6/4[chap01]!/4/2/16,/1:0,/1:19)",
  "source": "epub"
}
```

**Example Response** (201 Created):

```json
{
  "id": "hl-123",
  "bookId": "book-123",
  "userId": "user-123",
  "text": "The quick brown fox jumps over the lazy dog",
  "color": "yellow",
  "hex": "#FFFF00",
  "note": "Important phrase",
  "pageNumber": 5,
  "source": "pdf",
  "createdAt": "2024-01-20T14:22:00Z",
  "updatedAt": "2024-01-20T14:22:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Missing required fields
- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get All Highlights for a Book

**Endpoint**: `GET /api/highlights/:bookId`

**Description**: Fetch all highlights for a specific book.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book ID |

**Example Request**:

```bash
GET /api/highlights/book-123
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
[
  {
    "id": "hl-123",
    "bookId": "book-123",
    "userId": "user-123",
    "text": "The quick brown fox",
    "color": "yellow",
    "hex": "#FFFF00",
    "note": "Important",
    "pageNumber": 5,
    "source": "pdf",
    "createdAt": "2024-01-20T14:22:00Z"
  },
  {
    "id": "hl-124",
    "bookId": "book-123",
    "userId": "user-123",
    "text": "jumps over the lazy dog",
    "color": "blue",
    "hex": "#0000FF",
    "note": null,
    "pageNumber": 5,
    "source": "pdf",
    "createdAt": "2024-01-20T14:23:00Z"
  }
]
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get Single Highlight

**Endpoint**: `GET /api/highlights/:highlightId`

**Description**: Fetch a specific highlight by ID.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `highlightId` | string | Yes | Highlight ID |

**Example Request**:

```bash
GET /api/highlights/hl-123
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "id": "hl-123",
  "bookId": "book-123",
  "userId": "user-123",
  "text": "The quick brown fox",
  "color": "yellow",
  "hex": "#FFFF00",
  "note": "Important",
  "pageNumber": 5,
  "source": "pdf",
  "createdAt": "2024-01-20T14:22:00Z",
  "updatedAt": "2024-01-20T14:22:00Z"
}
```

**Error Responses**:

- `404 Not Found`: Highlight not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Update Highlight

**Endpoint**: `PUT /api/highlights/:highlightId`

**Description**: Update highlight color, note, or other properties.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `highlightId` | string | Yes | Highlight ID |

**Request Body**:

```typescript
{
  color?: string;       // Update color
  hex?: string;         // Update hex code
  note?: string;        // Update note
}
```

**Example Request**:

```bash
PUT /api/highlights/hl-123
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "color": "green",
  "hex": "#00FF00",
  "note": "Very important update"
}
```

**Example Response** (200 OK):

```json
{
  "id": "hl-123",
  "bookId": "book-123",
  "color": "green",
  "hex": "#00FF00",
  "note": "Very important update",
  "updatedAt": "2024-01-20T15:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Invalid data
- `404 Not Found`: Highlight not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Delete Highlight

**Endpoint**: `DELETE /api/highlights/:highlightId`

**Description**: Delete a specific highlight.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `highlightId` | string | Yes | Highlight ID |

**Example Request**:

```bash
DELETE /api/highlights/hl-123
Authorization: Bearer <access_token>
```

**Example Response** (204 No Content):

```
(empty body)
```

**Error Responses**:

- `404 Not Found`: Highlight not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get Highlight Statistics

**Endpoint**: `GET /api/highlights/:bookId/stats`

**Description**: Get statistics about highlights in a book (count by color, etc.).

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book ID |

**Example Request**:

```bash
GET /api/highlights/book-123/stats
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "totalHighlights": 25,
  "byColor": {
    "yellow": 10,
    "blue": 8,
    "green": 5,
    "red": 2
  },
  "withNotes": 12,
  "pages": [5, 8, 12, 15, 23]
}
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Search Highlights

**Endpoint**: `GET /api/highlights/:bookId/search`

**Description**: Search highlights by text content.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |

**Example Request**:

```bash
GET /api/highlights/book-123/search?q=brown+fox
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
[
  {
    "id": "hl-123",
    "bookId": "book-123",
    "text": "The quick brown fox jumps",
    "color": "yellow",
    "pageNumber": 5,
    "createdAt": "2024-01-20T14:22:00Z"
  }
]
```

**Error Responses**:

- `400 Bad Request`: Missing search query
- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Filter Highlights by Color

**Endpoint**: `GET /api/highlights/:bookId/filter`

**Description**: Filter highlights by one or more colors.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `colors` | string | Yes | Comma-separated color list |

**Example Request**:

```bash
GET /api/highlights/book-123/filter?colors=yellow,blue
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
[
  {
    "id": "hl-123",
    "text": "The quick brown fox",
    "color": "yellow",
    "pageNumber": 5
  },
  {
    "id": "hl-125",
    "text": "important detail",
    "color": "blue",
    "pageNumber": 8
  }
]
```

**Error Responses**:

- `400 Bad Request`: Invalid color format
- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Delete All Highlights for a Book

**Endpoint**: `DELETE /api/highlights/book/:bookId`

**Description**: Delete all highlights associated with a book. Use with caution!

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookId` | string | Yes | Book ID |

**Example Request**:

```bash
DELETE /api/highlights/book/book-123
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "message": "All highlights deleted",
  "count": 25
}
```

**Error Responses**:

- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

## Analytics API

Endpoints for reading statistics, sessions, and goals.

### Create Reading Session

**Endpoint**: `POST /api/analytics/session`

**Description**: Log a reading session with duration and pages read.

**Request Body**:

```typescript
{
  bookId: string;          // Book ID
  duration: number;        // Duration in seconds
  pagesRead?: number;      // Pages read in this session
  startPage?: number;      // Starting page
  endPage?: number;        // Ending page
  progressDelta?: number;  // Progress percentage change
}
```

**Example Request**:

```bash
POST /api/analytics/session
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookId": "book-123",
  "duration": 1800,
  "pagesRead": 25,
  "startPage": 200,
  "endPage": 225,
  "progressDelta": 5
}
```

**Example Response** (201 Created):

```json
{
  "id": "session-123",
  "bookId": "book-123",
  "userId": "user-123",
  "duration": 1800,
  "pagesRead": 25,
  "startPage": 200,
  "endPage": 225,
  "progressDelta": 5,
  "createdAt": "2024-01-20T14:22:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Missing required fields
- `404 Not Found`: Book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get Reading Statistics

**Endpoint**: `GET /api/analytics/stats`

**Description**: Get reading statistics for a time period.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | Time period: `all`, `week`, `month`, `year` (default: `all`) |

**Example Request**:

```bash
GET /api/analytics/stats?period=month
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "totalReadingTime": 36000,
  "totalPagesRead": 250,
  "booksFinished": 2,
  "booksReading": 3,
  "currentStreak": 7,
  "readingSpeed": 25,
  "sessionsCount": 15,
  "chartData": [
    {
      "date": "2024-01-20",
      "minutes": 120,
      "pages": 45
    },
    {
      "date": "2024-01-21",
      "minutes": 90,
      "pages": 30
    }
  ],
  "period": "month"
}
```

**Response Fields**:

- `totalReadingTime`: Total reading time in seconds
- `totalPagesRead`: Total pages read in period
- `booksFinished`: Number of completed books
- `booksReading`: Number of books in progress
- `currentStreak`: Current reading streak in days
- `readingSpeed`: Average pages per hour
- `sessionsCount`: Number of reading sessions
- `chartData`: Daily breakdown for visualization

**Error Responses**:

- `400 Bad Request`: Invalid period
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get Reading Goals

**Endpoint**: `GET /api/analytics/goals`

**Description**: Fetch all reading goals for the user.

**Example Request**:

```bash
GET /api/analytics/goals
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
[
  {
    "id": "goal-123",
    "userId": "user-123",
    "type": "books",
    "period": "yearly",
    "target": 24,
    "current": 5,
    "year": 2024,
    "month": null,
    "week": null,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  },
  {
    "id": "goal-124",
    "userId": "user-123",
    "type": "pages",
    "period": "monthly",
    "target": 500,
    "current": 245,
    "year": 2024,
    "month": 1,
    "week": null,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
]
```

**Error Responses**:

- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Create Reading Goal

**Endpoint**: `POST /api/analytics/goals`

**Description**: Create a new reading goal.

**Request Body**:

```typescript
{
  type: "books" | "pages" | "time"; // Goal type
  period: "daily" | "weekly" | "monthly" | "yearly"; // Time period
  target: number; // Target value
}
```

**Example Request**:

```bash
POST /api/analytics/goals
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "type": "books",
  "period": "yearly",
  "target": 24
}
```

**Example Response** (201 Created):

```json
{
  "id": "goal-125",
  "userId": "user-123",
  "type": "books",
  "period": "yearly",
  "target": 24,
  "current": 0,
  "year": 2024,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

**Error Responses**:

- `400 Bad Request`: Invalid goal type or period
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Update Reading Goal

**Endpoint**: `PUT /api/analytics/goals/:id`

**Description**: Update goal progress.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Goal ID |

**Request Body**:

```typescript
{
  current: number; // New current value
}
```

**Example Request**:

```bash
PUT /api/analytics/goals/goal-123
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "current": 10
}
```

**Example Response** (200 OK):

```json
{
  "id": "goal-123",
  "type": "books",
  "period": "yearly",
  "target": 24,
  "current": 10
}
```

**Error Responses**:

- `400 Bad Request`: Invalid data
- `404 Not Found`: Goal not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Delete Reading Goal

**Endpoint**: `DELETE /api/analytics/goals/:id`

**Description**: Delete a reading goal.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Goal ID |

**Example Request**:

```bash
DELETE /api/analytics/goals/goal-123
Authorization: Bearer <access_token>
```

**Example Response** (204 No Content):

```
(empty body)
```

**Error Responses**:

- `404 Not Found`: Goal not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

## Collections API

Endpoints for managing book collections and organization.

### Get All Collections

**Endpoint**: `GET /api/collections`

**Description**: Fetch all collections for the authenticated user.

**Example Request**:

```bash
GET /api/collections
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
[
  {
    "id": "col-123",
    "userId": "user-123",
    "name": "Fantasy Classics",
    "description": "My favorite fantasy books",
    "color": "#FF6B6B",
    "icon": "book",
    "isDefault": false,
    "bookIds": ["book-123", "book-124", "book-125"],
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
]
```

**Error Responses**:

- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Create Collection

**Endpoint**: `POST /api/collections`

**Description**: Create a new collection.

**Request Body**:

```typescript
{
  name: string;                // Collection name
  description?: string;        // Optional description
  color?: string;             // Optional color (hex or name)
  icon?: string;              // Optional icon identifier
}
```

**Example Request**:

```bash
POST /api/collections
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "Sci-Fi Favorites",
  "description": "Science fiction novels I love",
  "color": "#4ECDC4",
  "icon": "rocket"
}
```

**Example Response** (201 Created):

```json
{
  "id": "col-126",
  "userId": "user-123",
  "name": "Sci-Fi Favorites",
  "description": "Science fiction novels I love",
  "color": "#4ECDC4",
  "icon": "rocket",
  "isDefault": false,
  "bookIds": [],
  "createdAt": "2024-01-21T10:00:00Z",
  "updatedAt": "2024-01-21T10:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Missing name or invalid data
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Update Collection

**Endpoint**: `PATCH /api/collections/:id`

**Description**: Update collection properties.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Collection ID |

**Request Body**:

```typescript
{
  name?: string;           // Update name
  description?: string;    // Update description
  color?: string;          // Update color
  icon?: string;           // Update icon
}
```

**Example Request**:

```bash
PATCH /api/collections/col-123
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "description": "Updated description",
  "color": "#FF6B6B"
}
```

**Example Response** (200 OK):

```json
{
  "id": "col-123",
  "name": "Fantasy Classics",
  "description": "Updated description",
  "color": "#FF6B6B",
  "updatedAt": "2024-01-21T10:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Invalid data
- `404 Not Found`: Collection not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Delete Collection

**Endpoint**: `DELETE /api/collections/:id`

**Description**: Delete a collection. Books remain in the library.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Collection ID |

**Example Request**:

```bash
DELETE /api/collections/col-123
Authorization: Bearer <access_token>
```

**Example Response** (204 No Content):

```
(empty body)
```

**Error Responses**:

- `404 Not Found`: Collection not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Add Books to Collection

**Endpoint**: `POST /api/collections/:id/books`

**Description**: Add one or more books to a collection.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Collection ID |

**Request Body**:

```typescript
{
  bookIds: string[];    // Array of book IDs to add
}
```

**Example Request**:

```bash
POST /api/collections/col-123/books
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookIds": ["book-123", "book-124", "book-125"]
}
```

**Example Response** (200 OK):

```json
{
  "id": "col-123",
  "name": "Fantasy Classics",
  "bookIds": ["book-123", "book-124", "book-125"],
  "updatedAt": "2024-01-21T10:05:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Empty bookIds or invalid format
- `404 Not Found`: Collection or book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Remove Books from Collection

**Endpoint**: `DELETE /api/collections/:id/books`

**Description**: Remove one or more books from a collection.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Collection ID |

**Request Body**:

```typescript
{
  bookIds: string[];    // Array of book IDs to remove
}
```

**Example Request**:

```bash
DELETE /api/collections/col-123/books
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "bookIds": ["book-124"]
}
```

**Example Response** (200 OK):

```json
{
  "id": "col-123",
  "name": "Fantasy Classics",
  "bookIds": ["book-123", "book-125"],
  "updatedAt": "2024-01-21T10:10:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Empty bookIds
- `404 Not Found`: Collection or book not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

### Get Collection Books

**Endpoint**: `GET /api/collections/:id/books`

**Description**: Fetch all books in a collection.

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Collection ID |

**Example Request**:

```bash
GET /api/collections/col-123/books
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "collection": {
    "id": "col-123",
    "name": "Fantasy Classics",
    "description": "My favorite fantasy books",
    "bookIds": ["book-123", "book-124", "book-125"]
  },
  "books": [
    {
      "id": "book-123",
      "title": "Harry Potter",
      "author": "J.K. Rowling",
      "status": "completed",
      "progress": 100
    },
    {
      "id": "book-124",
      "title": "Lord of the Rings",
      "author": "J.R.R. Tolkien",
      "status": "reading",
      "progress": 60
    }
  ]
}
```

**Error Responses**:

- `404 Not Found`: Collection not found
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Server error

---

## Upload API

Endpoints for uploading books and files.

### Upload from URL

**Endpoint**: `POST /api/upload/from-url`

**Description**: Upload a book file from a remote URL.

**Request Body**:

```typescript
{
  url: string; // URL to book file
}
```

**Example Request**:

```bash
POST /api/upload/from-url
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "url": "https://example.com/files/mybook.pdf"
}
```

**Example Response** (201 Created):

```json
{
  "book": {
    "id": "book-200",
    "title": "mybook",
    "originalName": "mybook.pdf",
    "fileType": "pdf",
    "fileSize": 5242880,
    "status": "to-read",
    "progress": 0,
    "uploadedAt": "2024-01-21T10:15:00Z"
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid or unreachable URL
- `413 Payload Too Large`: File exceeds size limit (100MB)
- `415 Unsupported Media Type`: File type not supported
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Upload failed

---

### Upload Files (Multipart)

**Endpoint**: `POST /api/upload`

**Description**: Upload one or more book files directly.

**Request Format**: `multipart/form-data`

**Form Fields**:

- `files`: File array (PDF, EPUB, or TXT files, up to 100MB each)
- `title`: Book title
- `author`: Author name
- `genre`: Genre (optional)
- `language`: Language code (optional)

**Example Request** (cURL):

```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "files=@mybook.pdf" \
  -F "title=My Book" \
  -F "author=John Doe" \
  -F "genre=Fiction" \
  -F "language=en"
```

**Example Response** (200 OK):

```json
{
  "books": [
    {
      "id": "book-201",
      "title": "My Book",
      "author": "John Doe",
      "fileType": "pdf",
      "fileSize": 2097152,
      "genre": ["Fiction"],
      "language": "en",
      "status": "to-read",
      "progress": 0,
      "uploadedAt": "2024-01-21T10:20:00Z"
    }
  ]
}
```

**Error Responses**:

- `400 Bad Request`: Missing files or invalid metadata
- `413 Payload Too Large`: File exceeds size limit
- `415 Unsupported Media Type`: Unsupported file type
- `401 Unauthorized`: Not authorized
- `500 Internal Server Error`: Upload failed

---

## User API

Endpoints for managing user profile and account.

### Get User Profile

**Endpoint**: `GET /api/user/profile`

**Description**: Get current user's profile information.

**Example Request**:

```bash
GET /api/user/profile
Authorization: Bearer <access_token>
```

**Example Response** (200 OK):

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### Update User Name

**Endpoint**: `POST /api/user/update-name`

**Description**: Update the user's display name.

**Request Body**:

```typescript
{
  name: string; // New name (max 25 chars)
}
```

**Example Request**:

```bash
POST /api/user/update-name
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "name": "Jane Doe"
}
```

**Example Response** (200 OK):

```json
{
  "message": "Name updated successfully",
  "user": {
    "name": "Jane Doe"
  }
}
```

---

### Change Email

**Endpoint**: `POST /api/user/change-email`

**Description**: Change the user's email address.

**Request Body**:

```typescript
{
  newEmail: string; // New email address
  password: string; // Current password for verification
}
```

---

### Change Password

**Endpoint**: `POST /api/user/change-password`

**Description**: Change the user's password.

**Request Body**:

```typescript
{
  currentPassword: string; // Current password
  newPassword: string; // New password (min 8 chars)
}
```

---

### Sync User Profile

**Endpoint**: `POST /api/user/sync`

**Description**: Sync user profile data from Auth provider (Clerk/Auth0).

---

### Delete Account

**Endpoint**: `POST /api/user/delete`

**Description**: Permanently delete user account and all associated data.

**Request Body**:

```typescript
{
  email: string; // Email for verification
  password: string; // Password for verification
}
```

---

### Get Welcome Status

**Endpoint**: `GET /api/user/welcome-status`

**Description**: Check if the welcome screen has been shown.

---

### Mark Welcome Shown

**Endpoint**: `POST /api/user/welcome-shown`

**Description**: Mark the welcome screen as shown.

---

## Gutenberg API

Endpoints for interacting with Project Gutenberg.

### Import Book

**Endpoint**: `POST /api/gutenberg/import`

**Description**: Import a book from Project Gutenberg.

**Request Body**:

```typescript
{
  gutenbergId: string; // Gutenberg Book ID
}
```

**Example Request**:

```bash
POST /api/gutenberg/import
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "gutenbergId": "12345"
}
```

---

## Webhook API

Endpoints for external webhooks.

### Clerk Webhook

**Endpoint**: `POST /api/webhooks/clerk`

**Description**: Handle user events from Clerk (create, update, delete).

**Security**: Verifies Clerk signature.

---

## Authentication

### Session Management

**Endpoint**: `/api/auth/me`

**Description**: Get current authenticated user's session information.

**Example Request**:

```bash
GET /api/auth/me
```

**Example Response** (200 OK):

```json
{
  "user": {
    "sub": "auth0|123456",
    "nickname": "john.doe",
    "name": "John Doe",
    "picture": "https://avatars.example.com/avatar.jpg",
    "email": "john.doe@example.com",
    "email_verified": true,
    "aud": "https://booksreader-api",
    "iat": 1705750320,
    "exp": 1705836720
  }
}
```

### Token Refresh

Tokens are automatically refreshed by the Auth0 SDK in the middleware. The client maintains a cache to prevent redundant API calls during concurrent requests.

---

## Data Types

### Book Object

```typescript
interface Book {
  id: string; // Unique identifier
  title: string; // Book title
  author: string | null; // Author name
  fileName: string; // Storage file name
  originalName: string; // Original upload name
  fileUrl: string; // Current file URL
  fileId: string | null; // Storage file ID
  fileSize: number; // File size in bytes
  fileType?: "pdf" | "epub" | "txt"; // Document type
  userId: string; // Owner user ID
  coverUrl: string | null; // Cover image URL
  status: "to-read" | "reading" | "completed"; // Reading status
  progress: number; // 0-100 completion percentage
  currentPage: number; // Last read page
  totalPages: number; // Total pages
  uploadedAt: string; // Upload timestamp (ISO 8601)
  updatedAt: string; // Last update timestamp
  lastReadAt: string | null; // Last read timestamp
  description?: string | null; // Book description
  genre?: string[]; // Genre array
  publicationYear?: number | null; // Publication year
  isbn?: string | null; // ISBN number
  publisher?: string | null; // Publisher name
  language?: string | null; // Language code (ISO 639-1)
  pdfMetadata?: string | null; // Extracted PDF metadata
}
```

### Highlight Object

```typescript
interface Highlight {
  id: string; // Unique identifier
  bookId: string; // Associated book
  userId: string; // Owner user ID
  text: string; // Highlighted text
  color: string; // Color name
  hex: string; // Hex color code
  note?: string | null; // Optional annotation
  pageNumber?: number; // Page number (PDF/TXT)
  cfiRange?: string; // EPUB CFI range
  source: "pdf" | "epub" | "txt"; // Source type
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}
```

### Bookmark Object

```typescript
interface Bookmark {
  id: string; // Unique identifier
  bookId: string; // Associated book
  userId: string; // Owner user ID
  pageNumber: number; // Bookmarked page
  note?: string | null; // Optional note
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}
```

### Collection Object

```typescript
interface Collection {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  name: string; // Collection name
  description?: string | null; // Optional description
  color?: string | null; // Optional color (hex or name)
  icon?: string | null; // Optional icon identifier
  isDefault: boolean; // Whether this is default collection
  bookIds: string[]; // Array of book IDs
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
}
```

### Reading Session Object

```typescript
interface ReadingSession {
  id: string; // Unique identifier
  bookId: string; // Associated book
  userId: string; // Owner user ID
  duration: number; // Duration in seconds
  pagesRead: number; // Pages read in session
  startPage: number; // Starting page
  endPage: number; // Ending page
  progressDelta: number; // Progress percentage change
  createdAt: string; // Session timestamp
}
```

### Reading Goal Object

```typescript
interface ReadingGoal {
  id: string; // Unique identifier
  userId: string; // Owner user ID
  type: "books" | "pages" | "time"; // Goal type
  period: "daily" | "weekly" | "monthly" | "yearly"; // Time period
  target: number; // Target value
  current: number; // Current progress
  year: number | null; // Year (for yearly goals)
  month: number | null; // Month (for monthly goals)
  week: number | null; // Week (for weekly goals)
  startDate: string; // Period start (ISO 8601)
  endDate: string; // Period end (ISO 8601)
}
```

---

## Error Handling

All endpoints return consistent error responses with appropriate HTTP status codes.

### Error Response Format

```json
{
  "error": "Error message describing what went wrong",
  "statusCode": 400,
  "timestamp": "2024-01-21T10:00:00Z"
}
```

### Common HTTP Status Codes

| Code  | Meaning                | Common Causes                               |
| ----- | ---------------------- | ------------------------------------------- |
| `200` | OK                     | Successful GET, PATCH, PUT requests         |
| `201` | Created                | Successful POST requests (resource created) |
| `204` | No Content             | Successful DELETE requests                  |
| `400` | Bad Request            | Invalid input, missing required fields      |
| `401` | Unauthorized           | Missing or invalid authentication token     |
| `403` | Forbidden              | Authenticated but not authorized            |
| `404` | Not Found              | Resource not found                          |
| `413` | Payload Too Large      | File exceeds size limit                     |
| `415` | Unsupported Media Type | Invalid file type                           |
| `429` | Too Many Requests      | Rate limit exceeded                         |
| `500` | Internal Server Error  | Server error                                |
| `503` | Service Unavailable    | Server temporarily unavailable              |

### Error Handling in Client

The client library includes automatic error handling with:

- Retry logic with exponential backoff
- Clear error messages
- Proper error propagation

```typescript
try {
  const books = await fetchBooks(accessToken);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message); // User-friendly error message
  }
}
```

---

## Rate Limiting & Retry Strategy

### Rate Limiting

The backend implements rate limiting to prevent abuse:

- **Per User**: 1000 requests per 15 minutes
- **Per IP**: 5000 requests per 15 minutes
- **Upload**: 10 files per minute per user

**Rate Limit Headers**:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

### Retry Strategy

The client implements exponential backoff for failed requests:

```typescript
const API_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Retry sequence: 1s → 2s → 4s
```

**Retryable Operations**:

- GET requests (idempotent)
- Network timeouts
- 5xx server errors
- 429 (Too Many Requests)
- 408 (Request Timeout)

**Non-Retryable Operations**:

- POST/PUT/PATCH requests (by default, to prevent duplicates)
- 4xx client errors (except 408, 429)
- 401 Unauthorized

---

## Best Practices

### 1. **Token Management**

- Always use the token context for centralized access
- Tokens are cached and refreshed automatically
- Never hardcode tokens

### 2. **Error Handling**

- Always check response status
- Provide user-friendly error messages
- Log errors for debugging

### 3. **Performance**

- Use React Query for automatic caching
- Debounce search and filter requests
- Cache presigned URLs for 7 days
- Use parallel requests for independent operations

### 4. **Security**

- Always include Authorization header
- Use HTTPS in production
- Sanitize user inputs before display
- Never expose sensitive data in URLs

### 5. **Pagination**

- Implement pagination for large lists
- Use URL parameters for persistent state
- Show loading states during requests

### 6. **File Uploads**

- Validate file size before upload
- Validate file type (MIME type)
- Show progress indicators
- Handle cancellation gracefully

---

## Example Usage

### Complete Book Upload Workflow

```typescript
import { getAccessToken } from '@/hooks/useTokenCache';
import { uploadMultipleFiles } from '@/lib/upload';
import { fetchBooks } from '@/lib/api';

// 1. Get access token
const getToken = useTokenCache();
const accessToken = await getToken();

// 2. Prepare files and metadata
const files: File[] = [...];
const metadata = {
  title: 'My Book',
  author: 'John Doe',
  genre: ['Fiction'],
  language: 'en'
};

// 3. Upload with progress tracking
const results = await uploadMultipleFiles(
  files,
  metadata,
  accessToken,
  (progress) => console.log(`Progress: ${progress}%`)
);

// 4. Refetch library (React Query handles this)
const newBooks = await fetchBooks(accessToken);

// 5. Handle results
if (results.success) {
  console.log('Upload successful:', results.data);
} else {
  console.error('Upload failed:', results.error);
}
```

### Complete Highlight Workflow

```typescript
import {
  createHighlight,
  fetchHighlights,
  updateHighlight,
} from "@/lib/highlights-api";
import { useTokenCache } from "@/hooks/useTokenCache";

const getToken = useTokenCache();
const accessToken = await getToken();

// 1. Create highlight
const highlight = await createHighlight(
  "book-123",
  {
    text: "Important quote",
    color: "yellow",
    hex: "#FFFF00",
    note: "Remember this",
    pageNumber: 5,
    source: "pdf",
  },
  accessToken
);

// 2. Fetch all highlights
const allHighlights = await fetchHighlights("book-123", accessToken);

// 3. Update highlight
const updated = await updateHighlight(
  highlight.id,
  {
    color: "blue",
    hex: "#0000FF",
    note: "Updated note",
  },
  accessToken
);
```

---

## Changelog

### Version 1.0 (Current)

- All endpoints documented
- Error handling specifications
- Retry strategy documentation
- Best practices guide
- Example usage patterns

---

**Last Updated**: November 2024
**Version**: 1.0
**Status**: Production Ready
