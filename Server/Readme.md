# BooksReader - Server

A secure, production-ready Express backend for the BooksReader application. Handles file uploads (PDF, EPUB, TXT), stores files in Backblaze B2 cloud storage, manages book metadata in PostgreSQL, generates cover images, and provides comprehensive book management APIs with Clerk authentication.

---

## Features

### 📚 Core Features

#### File Upload & Management
- **Multiple Format Support**: PDF, EPUB, and TXT file uploads
- **Secure Upload Endpoint**: `POST /api/upload` — authenticated file upload with validation
- **Upload from URL**: `POST /api/upload/from-url` — fetch and store files from external URLs
- **File Validation**: Magic number validation ensures authentic file types
- **File Size Limits**: 100MB server-side limit with configurable upload restrictions
- **Cloud Storage**: All files uploaded to Backblaze B2 S3-compatible storage
- **Metadata Extraction**: Automatic PDF metadata parsing and storage

#### Book Management API
- **List Books**: `GET /api/books` — retrieve all user's books with filters
- **Get Book Details**: `GET /api/books/:id` — fetch comprehensive book information
- **Update Book**: `PATCH /api/books/:id` — modify metadata (title, author, status, progress, genre, etc.)
- **Delete Book**: `DELETE /api/books/:id` — remove book and associated file from storage
- **Enhanced Metadata**: Genre tags, publication year, ISBN, publisher, language support
- **Multi-format Support**: Separate utilities for PDF, EPUB, and TXT processing

#### Reading Progress & Bookmarks
- **Bookmarks API**: `GET/POST /api/bookmarks` — manage reading bookmarks
- **Highlights API**: `GET/POST /api/highlights` — store and retrieve highlighted passages
- **Analytics Tracking**: `GET/POST /api/analytics` — reading statistics and usage metrics
- **Collections**: `GET/POST /api/collections` — organize books into custom collections

#### Cover Image Generation
- **Automatic Cover Extraction**: Python-based cover image extraction from PDF, EPUB, TXT
- **Cover Generation Endpoint**: Generate and store cover images for books
- **Image Processing**: Uses Pillow and Sharp for image optimization
- **Supported Formats**: PNG, JPG extraction and conversion

#### Security & Authentication
- **Clerk JWT Validation**: RS256 token validation on all protected endpoints using Clerk-issued tokens
- **User Data Isolation**: Complete data segregation using Clerk user ID
- **CORS Protection**: Configurable Cross-Origin Resource Sharing
- **Rate Limiting**: Multi-tier rate limiting for API endpoints
- **Security Headers**: Helmet.js for HTTP security headers, CSP policies
- **Request Validation**: Zod schema validation for all inputs

#### Performance & Monitoring
- **Response Compression**: Automatic gzip compression for responses >1KB
- **Response Time Monitoring**: Track and log API performance metrics
- **Health Check Endpoint**: `GET /health` for uptime monitoring
- **Performance Statistics**: `GET /api/stats` for debugging and monitoring
- **Logging**: Winston logger with daily rotation and configurable levels
- **Request Timeouts**: Configurable timeout for long-running operations

### 🏗️ Architecture
- **Express 5.x** framework with modern middleware stack
- **Prisma ORM** for type-safe database operations
- **Modular Structure**: Controllers, services, routes, middleware separation
- **Error Handling**: Centralized error handler with custom error responses
- **Environment Configuration**: Centralized config validation

---

## Prerequisites

### Required Software
- **Node.js 18+** or compatible version
- **npm** or yarn package manager

### Required External Services
- **Clerk Account** (https://clerk.com)
     - Get your Publishable and Secret API keys in Clerk Dashboard
     - Configure a JWT Template for API validation and ensure your allowed origins/paths are set
  
- **PostgreSQL Database** (https://neon.tech - recommended free tier)
  - Neon PostgreSQL URL with connection string
  - Database created and accessible
  
- **Backblaze B2 Account** (https://www.backblaze.com/b2)
  - S3-compatible endpoint configured
  - Application Key ID and Application Key
  - B2 bucket created with public or private access
  - Region configured (e.g., `s3.us-west-001.backblazeb2.com`)

- **Python 3.8+** (for cover image extraction)
  - Required for Cover_Image_Generator module
  - Poppler utilities installed (for PDF processing)
  
### Optional Services
- **Docker** (for containerized deployment)

---

## Installation & Setup

### Step 1: Clone Repository & Install Dependencies

```powershell
# Navigate to server directory
cd Server

# Install Node.js dependencies
npm install
```

### Step 2: Configure Environment Variables

```powershell
# Copy example configuration
Copy-Item .env.example .env

# Edit `.env` with your credentials. The server expects Clerk keys in the `.env` file for token verification, e.g.:
code .env  # or use your preferred editor

```powershell
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key

# Application
PORT=3001
CLIENT_URL=http://localhost:3000
```
```

### Step 3: Set Up Database

```powershell
# Run Prisma migrations to create tables
npx prisma migrate dev --name init

# This will:
# - Apply all migrations from prisma/migrations/
# - Create required tables (Book, Bookmark, Highlight, Collection, etc.)
# - Generate Prisma Client
```

### Step 4: Verify Configuration

```powershell
# Validate all environment variables are set correctly
node -e "const {validateConfig} = require('./config'); validateConfig(); console.log('✓ Config valid')"

# Test database connection
npx prisma db execute --stdin < nul

# Open Prisma Studio to view database
npx prisma studio
# Opens at http://localhost:5555
```

### Step 5: Set Up Python Cover Generator (Optional)

```powershell
# Navigate to Cover_Image_Generator directory
cd Cover_Image_Generator

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt

# Return to server directory
cd ..
```

**Note**: Poppler installation required for PDF cover extraction:
- **Windows**: Download from https://github.com/oschwartz10612/poppler-windows/releases/ and add to PATH
- **Linux**: `sudo apt install poppler-utils`
- **macOS**: `brew install poppler`

---

## Scripts

### Development & Server

```powershell
# Start development server
npm start
npm run dev

# Start server in watch mode (requires nodemon - install separately)
npm run dev:watch
```

### Database Management

```powershell
# Run pending migrations
npx prisma migrate dev

# Create new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Reset database (removes all data!)
npx prisma migrate reset

# Open database GUI
npx prisma studio

# Regenerate Prisma Client
npx prisma generate
```

### Testing

```powershell
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm run test:unit
npm run test:integration

# Generate coverage report
npm run test:coverage

# Run verbose output
npm run test:verbose
```

### Build & Deployment

```powershell
# No explicit build needed (Node.js runs directly)
# For production, ensure NODE_ENV=production is set
npm start
```

---

## Project Workflow

### 1. Request Processing Flow

```
Client Request
     ↓
CORS Middleware (validate origin)
     ↓
Security Headers (Helmet.js)
     ↓
Request Compression Check
     ↓
Body Parser (JSON/URL-encoded)
     ↓
Response Time Monitor (middleware)
     ↓
Rate Limiter (check IP limits)
     ↓
Route Handler
     ↓
Auth Middleware (checkJwt - if required)
     ↓
Validation (Zod schemas)
     ↓
Controller Logic
     ↓
Service Layer (business logic)
     ↓
Database (Prisma ORM) / Cloud Storage (B2)
     ↓
Error Handler (if error occurs)
     ↓
Response
     ↓
Compression Applied
     ↓
Send to Client
```

### 2. File Upload Flow

```
User Uploads File
     ↓
Rate Limiter Check (uploadLimiter: 20/hour)
     ↓
JWT Authentication (checkJwt)
     ↓
Multer Middleware
  - Check file size (<100MB)
  - Store temporarily
     ↓
Magic Number Validation
  - Verify actual file type
  - Reject if file type mismatch
     ↓
Upload Service
  - Connect to B2 storage
  - Generate unique filename
  - Upload file to B2
     ↓
Metadata Extraction
  - Extract PDF metadata / EPUB metadata
  - Parse title, author, pages
     ↓
Database Storage (Prisma)
  - Save Book record
  - Store B2 file URL
  - Link to user (userId)
     ↓
Cover Generation (async)
  - Extract/generate cover image
  - Store in B2
  - Update database with cover URL
     ↓
Response to Client
  - Return book object with file URL
```

### 3. Book Management Flow

```
GET /api/books (retrieve user's books)
     ↓
Auth Check ✓
     ↓
Service queries Prisma
     ↓
Filter by userId
     ↓
Optional: Apply filters (status, genre, etc.)
     ↓
Return book list with pagination
```

```
PATCH /api/books/:id (update book)
     ↓
Auth Check ✓
     ↓
Validate ownership (userId match)
     ↓
Schema validation (Zod)
     ↓
Update in database
     ↓
Return updated book
```

### 4. Reading Features Flow

```
GET /api/bookmarks/:bookId (fetch bookmarks)
     ↓
Auth + Ownership check
     ↓
Query all bookmarks for this book
     ↓
Return bookmark list

POST /api/highlights (save highlight)
     ↓
Auth + Validation
     ↓
Store in database
     ↓
Return highlight record

GET /api/analytics (reading stats)
     ↓
Calculate time spent
     ↓
Compile statistics
     ↓
Return analytics
```

---

## File Directory Structure

```
Server/
├── .env.example                      # Template for environment variables
├── server.js                         # Main Express server entry point
├── package.json                      # Node.js dependencies and scripts
├── jest.config.js                    # Jest testing configuration
├── jest.setup.js                     # Jest setup and teardown
│
├── config/
│   ├── index.js                      # Centralized configuration management
│   ├── database.js                   # Database configuration
│   └── storage.js                    # B2/S3 storage configuration
│
├── middleware/
│   ├── auth.js                       # Clerk JWT validation (checkJwt)
│   ├── upload.js                     # Multer file upload middleware
│   ├── errorHandler.js               # Centralized error handling
│   ├── rateLimiter.js                # Rate limiting (API, auth, uploads, cover generation)
│   ├── responseTimeMonitor.js        # Request/response timing monitoring
│   └── validator.js                  # Input validation middleware
│
├── routes/
│   ├── index.js                      # Main router (mounts all routes)
│   ├── upload.routes.js              # File upload endpoints
│   ├── books.routes.js               # Book CRUD endpoints
│   ├── bookmarks.routes.js           # Bookmark endpoints
│   ├── highlights.js                 # Highlights endpoints
│   ├── analytics.routes.js           # Analytics endpoints
│   └── collections.routes.js         # Collections endpoints
│
├── controllers/
│   ├── upload.controller.js          # Upload logic
│   ├── books.controller.js           # Book CRUD logic
│   ├── bookmarks.controller.js       # Bookmark operations
│   ├── analytics.controller.js       # Analytics calculations
│   └── collections.controller.js     # Collection management
│
├── services/
│   ├── upload.service.js             # File upload/storage service
│   ├── books.service.js              # Book database operations
│   ├── bookmarks.service.js          # Bookmark service
│   ├── highlight-service.js          # Highlights service
│   ├── analytics.service.js          # Analytics service
│   └── collections.service.js        # Collections service
│
├── utils/
│   ├── logger.js                     # Winston logger configuration
│   ├── helpers.js                    # General utility functions
│   ├── pdfUtils.js                   # PDF parsing and metadata extraction
│   ├── epubUtils.js                  # EPUB processing utilities
│   ├── txtUtils.js                   # Text file utilities
│   ├── sanitize.js                   # Input sanitization
│   ├── commandSecurity.js            # Command execution security
│   └── errorResponse.js              # Standardized error responses
│
├── validators/
│   ├── schemas.js                    # Zod validation schemas for all endpoints
│   └── index.js                      # Validator exports
│
├── prisma/
│   ├── schema.prisma                 # Database schema (Prisma)
│   └── migrations/                   # Database migration files
│       ├── migration_lock.toml
│       └── [timestamp]_init/
│           └── migration.sql         # Individual migration SQL
│
├── Cover_Image_Generator/
│   ├── README.md                     # Python cover extraction tool guide
│   ├── Cover_Image_extractor.py      # Main Python script
│   ├── requirements.txt               # Python dependencies
│   └── Test/                         # Test files for cover extraction
│
├── scripts/
│   └── test-gen-cover.js             # Test script for cover generation
│
├── __tests__/
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│
```

## Database Schema Overview

### Core Models

**Book** — Main book record
- `id` (UUID) - Primary key
- `title`, `author`, `description`, `genre[]`
- `fileName`, `originalName`, `fileUrl`, `fileSize`
- `fileType` - "pdf" | "epub" | "txt"
- `userId` - Clerk user ID
- `status` - "unread" | "reading" | "read" | "want-to-read"
- `progress` (0-100), `currentPage`, `totalPages`
- `coverUrl` - URL to book cover image
- `isbn`, `publisher`, `publicationYear`, `language`
- `uploadedAt`, `updatedAt`, `lastReadAt`

**Bookmark** — Reading bookmarks
- `id` (UUID) - Primary key
- `bookId` - Reference to Book
- `page` / `location` - Position in book
- `timestamp` - When bookmark was created
- `userId` - Owner

**Highlight** — Highlighted passages
- `id` (UUID) - Primary key
- `bookId` - Reference to Book
- `content` - Highlighted text
- `page` / `location` - Position in book
- `color` - Highlight color
- `note` - User's note
- `createdAt` - When highlighted
- `userId` - Owner

**Collection** — Book collections
- `id` (UUID) - Primary key
- `name` - Collection name
- `description` - Collection details
- `books[]` - Array of book IDs
- `userId` - Owner
- `createdAt`, `updatedAt`

See `prisma/schema.prisma` for complete schema details.

---