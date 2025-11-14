# BooksReader Client

A modern, feature-rich web application for reading and managing digital books (PDF, EPUB, TXT) online. Built with Next.js 15, React 19, TypeScript, and a comprehensive set of modern web technologies.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Setup](#quick-setup)
- [Project Structure](#project-structure)
- [System Overview](#system-overview)
- [Workflow](#workflow)

---

## Features

### 🔐 Authentication & Security
- **Auth0 Integration**: Secure authentication with support for multiple OAuth providers (Google, GitHub, etc.)
- **JWT Token Management**: Centralized token caching with automatic refresh and race condition prevention
- **Protected Routes**: Middleware-based route protection for authenticated pages
- **Session Management**: Persistent sessions with secure cookie handling
- **Content Security Policy**: Comprehensive CSP headers for XSS prevention
- **Input Sanitization**: Multi-layer sanitization for all user inputs (text, HTML, URLs, metadata)

### 📚 Library Management
- **Multi-format Support**: Upload and manage PDF, EPUB, and TXT files (up to 100MB per file)
- **Dual Upload Methods**: 
  - Direct file upload (drag & drop or file picker)
  - URL-based import for remote files
- **Rich Metadata**: Track title, author, genre, publication year, language, and custom tags
- **Advanced Filtering**: Filter by status, genre, language, tags, and publication year
- **Search Functionality**: Real-time search across titles, authors, and metadata
- **Collections**: Organize books into custom collections with drag-and-drop management
- **Reading Status**: Track books as "To Read," "Reading," or "Completed"
- **Bulk Operations**: Select multiple books for batch status updates, collection assignment, or deletion
- **View Modes**: Switch between grid, list, and compact views with pagination
- **Book Statistics**: View reading progress, completion percentage, and time spent

### 📖 Reading Experience

#### PDF Reader
- **Mozilla PDF.js**: Industry-standard PDF rendering with full feature support
- **Page Navigation**: Previous/next, jump to page, thumbnail sidebar
- **Zoom Controls**: Fit-to-width, fit-to-page, custom zoom levels (50%-200%)
- **Search**: Full-text search within PDFs with match highlighting
- **Bookmarks**: Create, edit, and navigate page bookmarks
- **Highlights**: 
  - Multi-color text highlighting (5 preset colors)
  - Add notes to highlights
  - Highlight management panel
  - Export highlights
- **Text-to-Speech**: Built-in TTS with play/pause, speed control, and voice selection
- **Reading Progress**: Auto-save current page and overall progress percentage
- **Display Options**: Adjust brightness, contrast, and page layout
- **Keyboard Shortcuts**: Arrow keys for navigation, Esc to exit fullscreen

#### EPUB Reader
- **ePub.js Integration**: Native EPUB 2/3 support with reflowable text
- **Chapter Navigation**: Table of contents with hierarchical chapter structure
- **Text Customization**: 
  - Font family selection (5+ system fonts)
  - Font size adjustment (12px-32px)
  - Line height control
  - Letter spacing adjustment
- **Themes**: Light, sepia, and dark reading modes
- **Color Filters**: Night mode with adjustable opacity
- **Bookmarks**: Chapter-based bookmarking with CFI (Canonical Fragment Identifier) support
- **Highlights**: 
  - Context-aware text highlighting
  - Color-coded annotations
  - Notes and comments
- **Search**: Search across entire EPUB content
- **Text-to-Speech**: Read-aloud functionality with natural voices
- **Progress Tracking**: Percentage-based progress with auto-save
- **Responsive**: Adaptive layout for desktop, tablet, and mobile

#### TXT Reader
- **Plain Text Support**: Fast, lightweight text file rendering
- **Font Customization**: Multiple font families and sizes
- **Reading Themes**: Light, sepia, dark modes
- **Bookmarks**: Line-based bookmarking
- **Highlights**: Simple text selection and highlighting
- **Search**: Fast in-document search
- **Text-to-Speech**: Built-in TTS support
- **Word Count**: Display total words and estimated reading time

### 📊 Analytics & Insights
- **Reading Stats Dashboard**: 
  - Total books read, pages read, reading time
  - Books by status breakdown
  - Reading streak tracking
  - Weekly/monthly reading trends
  - Genre distribution charts
- **Reading Goals**: 
  - Set annual/monthly reading goals
  - Track progress with visual indicators
  - Goal history and completion rates
- **Session Tracking**: Automatic reading session recording with timestamps

### 🎨 User Experience
- **Dark Mode**: System-aware theme with manual toggle (light/dark/system)
- **Responsive Design**: Fully responsive layout for all screen sizes
- **Progressive Web App**: Installable with offline support (planned)
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Loading States**: Skeleton loaders and progress indicators
- **Error Boundaries**: Graceful error handling with user-friendly messages
- **Toast Notifications**: Non-intrusive feedback for user actions
- **Virtual Scrolling**: Performance-optimized rendering for large libraries
- **Lazy Loading**: Dynamic imports for code splitting and faster initial load

### 🔧 Developer Features
- **TypeScript**: Full type safety across the codebase
- **React Query**: Powerful data fetching with caching and automatic refetching
- **Custom Hooks**: Reusable hooks for auth, library state, reading mode, etc.
- **Context Providers**: Centralized state management for auth tokens and themes
- **Component Library**: ShadCN UI + Radix UI for accessible, customizable components
- **Testing**: Jest + React Testing Library for unit and integration tests
- **ESLint**: Strict linting rules for code quality
- **Turbopack**: Fast development with Next.js Turbopack bundler

---

## Tech Stack

### Core Framework
- **Next.js 15.5.4**: React framework with App Router, server components, and API routes
- **React 19.1.0**: Latest React with concurrent features and automatic batching
- **TypeScript 5.x**: Static typing for enhanced developer experience and reliability

### UI & Styling
- **Tailwind CSS 4**: Utility-first CSS framework with custom configuration
- **Radix UI**: Unstyled, accessible component primitives
  - Dialog, Dropdown Menu, Select, Slider, Tabs, Progress, Checkbox, Avatar, Alert Dialog
- **Lucide React**: Modern icon library with 1000+ icons
- **React Icons**: Additional icon sets
- **class-variance-authority**: Type-safe component variants
- **clsx & tailwind-merge**: Conditional class merging

### Authentication & State
- **Auth0 (@auth0/nextjs-auth0)**: Secure authentication with OAuth 2.0 and OpenID Connect
- **React Query (@tanstack/react-query)**: Server state management with caching
- **Immer**: Immutable state updates with mutable syntax
- **cookies-next**: Cookie management for client and server

### Reading & Document Handling
- **PDF.js (pdfjs-dist 4.4.168)**: Mozilla's PDF rendering engine
- **ePub.js**: EPUB reader library for reflowable books
- **react-reader**: React wrapper for ePub.js
- **react-pdf-highlighter**: PDF annotation and highlighting library

### Performance & Optimization
- **@tanstack/react-virtual**: Virtual scrolling for large lists
- **react-window**: Windowing library for efficient rendering
- **next-themes**: Theme management with system preference detection
- **Dynamic Imports**: Code splitting for lazy-loaded components

### Data Visualization
- **Recharts**: Composable charting library for reading analytics

### Development Tools
- **ESLint**: Linting with Next.js recommended config
- **Jest**: Testing framework with jsdom environment
- **@testing-library/react**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **ts-node**: TypeScript execution for scripts

### Build Tools
- **Turbopack**: Next.js's Rust-based bundler (dev & build)
- **PostCSS**: CSS transformations for Tailwind
- **TypeScript Compiler**: Type checking and transpilation

---

## Prerequisites

Before setting up the BooksReader client, ensure you have:

### Required
- **Node.js 18+**: JavaScript runtime (LTS version recommended)
- **npm 9+**: Package manager (comes with Node.js)
- **Backend Server**: The BooksReader backend must be running (see `Server/` directory)

### Required External Services
- **Auth0 Account**: For authentication
  - Free tier available at [auth0.com](https://auth0.com)
  - Requires configured application and API
- **Backend API**: Running Express.js server with:
  - PostgreSQL database (Neon recommended)
  - Backblaze B2 storage configured
  - Auth0 JWT validation

### Recommended
- **Git**: Version control
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Must be enabled
- **Cookies**: Must be enabled for authentication
- **Local Storage**: Required for theme preferences and caching

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/1arunjyoti/BooksReader.git
cd BooksReader/Client
```

### 2. Install Dependencies
```bash
npm install
```

This will:
- Install all required packages from `package.json`
- Run the postinstall script to copy the PDF.js worker file to `public/`
- Set up development environment

### 3. Create Environment File
```bash
cp .env.example .env.local
```

### 4. Configure Environment Variables

Edit `.env.local` with your values:

```env
# App Configuration
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Auth0 Configuration
AUTH0_SECRET=your-generated-secret-here  # Generate with: openssl rand -hex 32
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=https://your-api-identifier

# Optional: Image Domains (comma-separated)
NEXT_PUBLIC_IMAGE_DOMAINS=
```

### 5. Verify Installation
```bash
npm run dev
```

If successful, you'll see:
```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## Quick Setup

### 1. Auth0 Setup

#### Create Auth0 Application
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications** → **Create Application**
3. Application Settings:
   - **Name**: BooksReader Client
   - **Type**: Regular Web Application
   - **Technology**: Next.js
4. Click **Create**

#### Configure Application
In the application settings:

**Application URIs**
```
Allowed Callback URLs:
http://localhost:3000/api/auth/callback

Allowed Logout URLs:
http://localhost:3000

Allowed Web Origins:
http://localhost:3000
```

**Advanced Settings** → **Grant Types**
- ✅ Authorization Code
- ✅ Refresh Token

**Save Changes**

#### Create Auth0 API
1. Navigate to **Applications** → **APIs** → **Create API**
2. API Settings:
   - **Name**: BooksReader API
   - **Identifier**: `https://booksreader-api` (or your custom identifier)
   - **Signing Algorithm**: RS256
3. Click **Create**

#### Update Client Environment
Copy credentials from Auth0 dashboard to `.env.local`:

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=abc123xyz789
AUTH0_CLIENT_SECRET=your-client-secret-here
AUTH0_AUDIENCE=https://booksreader-api
AUTH0_SECRET=generate-with-openssl-rand-hex-32
```

Generate the `AUTH0_SECRET`:
```bash
openssl rand -hex 32
```

### 2. Backend Server Setup

The client requires the backend server to be running. See `../Server/README.md` for detailed setup.

**Quick Backend Start:**
```bash
cd ../Server
npm install
npm start
```

Verify backend is running at `http://localhost:3001`

### 3. Start Development Server

```bash
cd Client
npm run dev
```

Visit `http://localhost:3000` and you should see the landing page.

### 4. Test Authentication Flow

1. Click **Sign In** in the navbar
2. You'll be redirected to Auth0 login page
3. Sign in with your configured provider (Google, email, etc.)
4. After successful authentication, you'll be redirected to `/library`
5. Upload a book to test the full workflow

---

## Project Structure

```
Client/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global styles & Tailwind imports
│   │
│   ├── (auth)/                   # Authentication routes (grouped)
│   │   ├── signin/               # Sign-in page
│   │   └── signup/               # Sign-up page
│   │
│   ├── api/                      # API routes
│   │   └── auth/                 # Auth0 API handlers (handled by SDK)
│   │
│   ├── library/                  # Library management
│   │   ├── page.tsx              # Main library page
│   │   ├── collections/          # Collections management page
│   │   └── read/                 # Reading interface
│   │       └── [id]/
│   │           └── page.tsx      # Dynamic book reader
│   │
│   ├── profile/                  # User profile & settings
│   │   └── page.tsx              # Profile dashboard
│   │
│   ├── about/                    # About page
│   ├── contact/                  # Contact page
│   ├── privacy/                  # Privacy policy
│   └── terms/                    # Terms of service
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (ShadCN)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── checkbox.tsx
│   │   ├── avatar.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── alert-dialog.tsx
│   │
│   ├── layout/                   # Layout components
│   │   ├── navbar.tsx            # Navigation bar
│   │   └── footer.tsx            # Page footer
│   │
│   ├── library/                  # Library-specific components
│   │   ├── upload-dialog.tsx     # Multi-tab upload dialog
│   │   ├── upload-files.tsx      # File upload component
│   │   ├── upload-from-url.tsx   # URL import component
│   │   ├── edit-book-metadata.tsx# Metadata editor
│   │   ├── SearchBar.tsx         # Search input
│   │   ├── StatusFilter.tsx      # Status dropdown filter
│   │   ├── ViewModeToggle.tsx    # Grid/list view toggle
│   │   ├── SelectionBar.tsx      # Bulk action toolbar
│   │   ├── ActionMenu.tsx        # Book action menu
│   │   ├── advanced-filters.tsx  # Advanced filter panel
│   │   ├── collection-filter.tsx # Collection selector
│   │   ├── add-to-collection-dialog.tsx # Collection assignment
│   │   ├── collections-manager.tsx# Collection CRUD
│   │   ├── LibraryPagination.tsx # Pagination controls
│   │   ├── VirtualizedBooks.tsx  # Virtual scrolling list
│   │   └── Skeletons.tsx         # Loading skeletons
│   │
│   ├── reader/                   # Reading components
│   │   ├── pdf_Reader/           # PDF reader components
│   │   │   ├── pdf-reader.tsx    # Main PDF reader
│   │   │   ├── pdf-viewer.tsx    # PDF canvas renderer
│   │   │   ├── pdf-scroll-viewer.tsx # Scrolling view
│   │   │   ├── pdf-search-panel.tsx # Search interface
│   │   │   ├── PDFHighlightsPanel.tsx # Highlights manager
│   │   │   ├── PDFContentsAndBookmarksPanel.tsx # TOC & bookmarks
│   │   │   ├── PDFDisplayOptionsPanel.tsx # Display settings
│   │   │   ├── PDFTTSPanel.tsx   # Text-to-speech
│   │   │   ├── highlight-colors.ts # Color definitions
│   │   │   ├── pdfReaderReducers.ts # State reducers
│   │   │   └── PDFReaderErrorBoundary.tsx # Error handling
│   │   │
│   │   ├── epub_Reader/          # EPUB reader components
│   │   │   ├── react-epub-viewer-refactored.tsx # Main EPUB reader
│   │   │   ├── EpubReaderCore.tsx # Core reading logic
│   │   │   ├── EpubToolbar.tsx   # Toolbar controls
│   │   │   ├── EpubTocPanel.tsx  # Table of contents
│   │   │   ├── EpubSearchPanel.tsx # Search interface
│   │   │   ├── EpubHighlightsPanel.tsx # Highlights manager
│   │   │   ├── ContentsAndBookmarksPanel.tsx # Navigation
│   │   │   ├── DisplayOptionsPanel.tsx # Display settings
│   │   │   ├── EpubColorFilterPanel.tsx # Night mode
│   │   │   ├── EpubTTSPanel.tsx  # Text-to-speech
│   │   │   ├── ColorPickerPopup.tsx # Color picker
│   │   │   └── hooks/            # EPUB-specific hooks
│   │   │
│   │   ├── txt_Reader/           # TXT reader components
│   │   │   ├── txt-viewer.tsx    # Main TXT reader
│   │   │   ├── TxtToolbar.tsx    # Toolbar controls
│   │   │   ├── TxtHighlightsPanel.tsx # Highlights
│   │   │   ├── TxtSearchPanel.tsx # Search
│   │   │   ├── TxtTTSPanel.tsx   # Text-to-speech
│   │   │   ├── TxtDisplayOptionsPanel.tsx # Settings
│   │   │   └── ColorPickerPopup.tsx # Color picker
│   │   │
│   │   ├── bookmark-panel.tsx    # Bookmark manager
│   │   ├── bookmark-form.tsx     # Bookmark creation form
│   │   ├── thumbnail-sidebar.tsx # Page thumbnails (PDF)
│   │   ├── toc-panel.tsx         # Generic TOC component
│   │   └── tts-controls.tsx      # Shared TTS controls
│   │
│   ├── analytics/                # Analytics components
│   │   ├── reading-stats-dashboard.tsx # Stats overview
│   │   └── reading-goals.tsx     # Goal tracking
│   │
│   ├── profile/                  # Profile components
│   │   ├── delete-account.tsx    # Account deletion
│   │   ├── change-email.tsx      # Email change
│   │   └── change-password.tsx   # Password change
│   │
│   ├── auth/                     # Auth components
│   │
│   ├── providers.tsx             # Theme provider
│   ├── QueryProvider.tsx         # React Query provider
│   ├── ThemeSwitcher.tsx         # Theme toggle button
│   ├── ContactForm.tsx           # Contact form
│   ├── ErrorBoundary.tsx         # Error boundary wrapper
│   ├── icons.tsx                 # Custom icon components
│   └── label.tsx                 # Form label component
│
├── contexts/                     # React contexts
│   └── AuthTokenContext.tsx      # Centralized token management
│
├── hooks/                        # Custom React hooks
│   ├── useTokenCache.ts          # Token caching hook
│   ├── useLibraryFilters.ts      # Library filter state
│   ├── useLibraryState.ts        # Library UI state
│   ├── useViewPreferences.ts     # View mode persistence
│   ├── useReadingMode.ts         # Reading mode tracker
│   ├── useMobileDetection.ts     # Responsive breakpoint hook
│   └── useValueAdjuster.ts       # Increment/decrement utility
│
├── lib/                          # Utility libraries
│   ├── api.ts                    # API client functions
│   ├── highlights-api.ts         # Highlights API wrapper
│   ├── auth0.ts                  # Auth0 client configuration
│   ├── auth-client.ts            # Auth utilities
│   ├── session.ts                # Session helpers
│   ├── upload.ts                 # File upload logic
│   ├── sanitize.ts               # Input sanitization
│   ├── sanitize-text.ts          # Text sanitization
│   ├── epub-cache.ts             # EPUB URL caching
│   ├── epub-preloader.ts         # EPUB.js preloader
│   ├── pdf-preloader.ts          # PDF.js preloader
│   ├── pdf-worker-init.ts        # PDF.js worker setup
│   ├── retry-utils.ts            # Retry with exponential backoff
│   ├── safe-local-storage.ts     # Safe storage wrapper
│   └── utils.ts                  # General utilities
│
├── types/                        # TypeScript type definitions
│   └── highlights.ts             # Highlight types
│
├── public/                       # Static assets
│   ├── pdf.worker.min.mjs        # PDF.js worker (copied by script)
│   ├── favicon.ico               # Favicon
│   ├── apple-touch-icon.png      # iOS icon
│   ├── android-chrome-*.png      # Android icons
│   └── site.webmanifest          # PWA manifest
│
├── scripts/                      # Build scripts
│   └── copy-pdf-worker.js        # Copy PDF.js worker to public/
│
├── __tests__/                    # Test files
│   ├── epub-reader.integration.test.tsx
│   ├── epub-bookmarks.integration.test.tsx
│   ├── epub-highlights.integration.test.tsx
│   └── sanitize.test.ts
│
├── coverage/                     # Test coverage reports
│
├── middleware.ts                 # Next.js middleware (auth protection)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── components.json               # ShadCN UI configuration
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Jest setup file
├── eslint.config.mjs             # ESLint configuration
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Locked dependencies
└── README.md                     # This file
```

---

## System Overview

### Architecture

BooksReader Client follows a modern **Next.js App Router** architecture with a clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js App (React 19 + TypeScript)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  App Router (app/)                                    │  │
│  │  • Server Components (SSR, metadata)                  │  │
│  │  • Client Components (interactivity)                  │  │
│  │  • API Routes (auth handlers)                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  State Management                                     │  │
│  │  • React Query (server state, caching)               │  │
│  │  • Context API (auth tokens, theme)                  │  │
│  │  • Custom Hooks (filters, reading mode)              │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Component Layer                                      │  │
│  │  • UI Components (ShadCN + Radix UI)                 │  │
│  │  • Feature Components (readers, library)             │  │
│  │  • Layout Components (navbar, footer)                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Middleware Layer (middleware.ts)                            │
│  • Route Protection                                          │
│  • Auth0 Session Management                                  │
│  • Redirects                                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  External Services                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │  Auth0      │  │  Backend    │  │  Backblaze B2    │    │
│  │  (OAuth)    │  │  API        │  │  (File Storage)  │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

#### 1. **Authentication Flow**
- **Auth0 SDK**: Handles OAuth 2.0 flow, session cookies, token refresh
- **Middleware**: Intercepts requests, validates sessions, protects routes
- **Token Context**: Centralizes token management, prevents race conditions
- **Caching**: Tokens cached in memory with expiry tracking (reduces API calls by 95%)

#### 2. **Data Fetching Strategy**
- **React Query**: Automatic caching, background refetching, optimistic updates
- **Parallel Requests**: Fetch book metadata and presigned URL simultaneously
- **Retry Logic**: Exponential backoff for failed requests
- **Stale-While-Revalidate**: Show cached data while fetching fresh data

#### 3. **State Management**
- **Server State**: React Query for API data (books, highlights, bookmarks)
- **Client State**: React Context for global state (auth, theme)
- **Local State**: React hooks for component-specific state
- **URL State**: Search params for pagination, filters (shareable, refresh-persistent)

#### 4. **Performance Optimizations**
- **Code Splitting**: Dynamic imports for heavy components (EPUB reader)
- **Virtual Scrolling**: Render only visible items in large lists
- **Image Optimization**: Next.js Image component with lazy loading
- **Memoization**: React.memo, useMemo, useCallback for expensive operations
- **Debouncing**: Debounced search and progress updates
- **Presigned URL Caching**: Cache presigned URLs for 7 days to avoid regeneration

#### 5. **Security Measures**
- **CSP Headers**: Prevent XSS attacks with strict Content Security Policy
- **Input Sanitization**: All user inputs sanitized before display/storage
- **JWT Validation**: Backend validates all JWT tokens
- **HTTPS Only**: Strict Transport Security in production
- **Frame Options**: X-Frame-Options: DENY to prevent clickjacking
- **No Inline Scripts**: All scripts externalized or hashed

### Technology Integration

#### PDF.js Integration
1. Worker file copied to `public/` during `npm install` (postinstall script)
2. Worker initialized in `lib/pdf-worker-init.ts`
3. PDF.js loaded dynamically when PDF reader is opened
4. Canvas-based rendering with text layer for selection/search

#### ePub.js Integration
1. Dynamically imported to reduce initial bundle size
2. CFI (Canonical Fragment Identifier) for precise location tracking
3. Custom theme support with CSS injection
4. Rendition hooks for chapter navigation and progress

#### Auth0 Integration
1. SDK handles all OAuth flows automatically
2. Middleware validates sessions on every protected route
3. Token Context provides centralized token access
4. Automatic token refresh before expiry

#### React Query Integration
1. Queries for GET requests (fetchBooks, fetchHighlights)
2. Mutations for POST/PUT/DELETE (createBook, updateHighlight)
3. Optimistic updates for instant UI feedback
4. Automatic cache invalidation on mutations

---

## Workflow

### User Journey: From Sign-In to Reading

```
1. Landing Page (/)
   │
   ├─→ Click "Sign In"
   │
2. Auth0 Login (/api/auth/login)
   │
   ├─→ Redirect to Auth0 Hosted Login Page
   │
   ├─→ User authenticates (email/password or OAuth)
   │
   ├─→ Auth0 redirects to /api/auth/callback
   │
3. Callback Handler
   │
   ├─→ Middleware validates session
   │
   ├─→ Session cookie set (encrypted)
   │
   ├─→ Redirect to /library (or returnTo URL)
   │
4. Library Page (/library)
   │
   ├─→ Middleware checks authentication ✓
   │
   ├─→ Token Context fetches access token
   │
   ├─→ React Query fetches books from API
   │
   ├─→ Display books in grid/list view
   │
   ├─→ User Actions:
   │   ├─→ Upload new book → UploadDialog
   │   ├─→ Filter/search books → useLibraryFilters
   │   ├─→ Bulk select books → SelectionBar
   │   ├─→ Create collection → CollectionsManager
   │   └─→ Click book to read ↓
   │
5. Book Reader (/library/read/[id])
   │
   ├─→ Middleware checks authentication ✓
   │
   ├─→ Fetch book metadata (parallel with URL)
   │
   ├─→ Get presigned URL for file (cached if exists)
   │
   ├─→ Determine book format (PDF/EPUB/TXT)
   │
   ├─→ Load appropriate reader:
   │   ├─→ PDF: PDFReader component
   │   ├─→ EPUB: ReactEpubViewer (lazy loaded)
   │   └─→ TXT: TxtViewer component
   │
   ├─→ Reader Features:
   │   ├─→ Restore last read position
   │   ├─→ Display book content
   │   ├─→ Enable navigation (pages/chapters)
   │   ├─→ Load bookmarks & highlights from API
   │   ├─→ Enable toolbar (zoom, search, TTS, etc.)
   │   │
   │   └─→ User Interactions:
   │       ├─→ Navigate pages → Auto-save progress
   │       ├─→ Create bookmark → POST to API
   │       ├─→ Highlight text → POST to API
   │       ├─→ Search text → In-memory search
   │       ├─→ Adjust settings → Update local state
   │       └─→ Exit reader → Return to library
   │
6. Profile Page (/profile)
   │
   ├─→ Display user info from Auth0 session
   │
   ├─→ Show reading statistics (API fetch)
   │
   ├─→ Display reading goals (API fetch)
   │
   └─→ Account settings (email, password, delete)
```

### Developer Workflow: Adding a New Feature

```
1. Plan Feature
   ├─→ Define requirements
   ├─→ Design component structure
   └─→ Identify API endpoints needed

2. Backend (if new data needed)
   ├─→ Create Prisma schema
   ├─→ Run migration
   ├─→ Create API route
   └─→ Add authentication middleware

3. Frontend (Client)
   │
   ├─→ Create Types (types/*.ts)
   │
   ├─→ Create API Functions (lib/api.ts)
   │   ├─→ Add fetch functions
   │   ├─→ Include authorization headers
   │   └─→ Add error handling
   │
   ├─→ Create Components (components/*)
   │   ├─→ Build UI components
   │   ├─→ Add ShadCN/Radix UI primitives
   │   └─→ Style with Tailwind CSS
   │
   ├─→ Create Hooks (hooks/*) (optional)
   │   └─→ Extract reusable logic
   │
   ├─→ Create Page (app/*)
   │   ├─→ Compose components
   │   ├─→ Add React Query hooks
   │   ├─→ Handle loading/error states
   │   └─→ Add metadata for SEO
   │
   ├─→ Add Tests (__tests__/*)
   │   ├─→ Unit tests for utilities
   │   ├─→ Component tests with RTL
   │   └─→ Integration tests for flows
   │
   └─→ Update Documentation
       ├─→ Update README.md
       ├─→ Add JSDoc comments
       └─→ Document environment variables

4. Test Locally
   ├─→ Run dev server: npm run dev
   ├─→ Test all user flows
   ├─→ Run tests: npm test
   ├─→ Check linting: npm run lint
   └─→ Verify responsive design

5. Deploy
   ├─→ Commit changes
   ├─→ Push to repository
   ├─→ Deploy to Vercel (auto)
   └─→ Monitor for errors
```

### Data Flow: Creating a Highlight

```
User selects text in reader
   ↓
Reader component captures selection
   ↓
Color picker popup opens
   ↓
User selects color & adds note (optional)
   ↓
Component calls `createHighlight()` from lib/highlights-api.ts
   ↓
Function prepares payload:
   {
     bookId: "123",
     text: "Selected text",
     color: "yellow",
     hex: "#FFFF00",
     note: "My note",
     pageNumber: 5 (PDF) OR cfiRange: "epubcfi(...)" (EPUB),
     rects: [...] (PDF only),
     source: "pdf" | "epub" | "txt"
   }
   ↓
POST request to backend API with Authorization header
   ↓
Backend validates JWT token
   ↓
Backend saves highlight to PostgreSQL
   ↓
Backend returns created highlight with ID
   ↓
React Query mutation succeeds
   ↓
Cache invalidated → Refetch highlights list
   ↓
UI updates with new highlight
   ↓
Highlight rendered on page/chapter
```

### Authentication Token Flow

```
Component needs to make API call
   ↓
Component calls `useTokenCache()` hook
   ↓
Hook calls `getAccessToken()` from AuthTokenContext
   ↓
Context checks in-memory cache:
   ├─→ Token exists & not expired → Return cached token
   └─→ Token missing/expired → Continue ↓
   ↓
Context checks if fetch is already in progress:
   ├─→ Yes → Wait for existing fetch (prevents duplicate calls)
   └─→ No → Continue ↓
   ↓
Context calls `/api/auth/me` endpoint
   ↓
Auth0 SDK validates session cookie
   ↓
SDK returns access token with expiry
   ↓
Context caches token in memory (expiresAt = now + tokenTTL - 60s buffer)
   ↓
Return token to component
   ↓
Component makes API call with token in Authorization header
```

### File Upload Flow

```
User opens UploadDialog
   ↓
User selects tab:
   ├─→ "Files" tab (drag & drop or file picker)
   └─→ "URL" tab (paste URL)
   ↓
User selects files or enters URL
   ↓
Component validates:
   ├─→ File size (max 100MB)
   ├─→ File type (PDF/EPUB/TXT)
   └─→ URL format (if URL tab)
   ↓
Component displays preview with metadata fields
   ↓
User fills metadata (title, author, etc.)
   ↓
User clicks "Upload"
   ↓
Component calls:
   ├─→ uploadMultipleFiles() (for file tab)
   └─→ uploadFromUrl() (for URL tab)
   ↓
Function creates FormData with:
   ├─→ file (Blob)
   ├─→ title, author, genre, etc. (sanitized)
   └─→ Authorization header with access token
   ↓
POST to backend /api/books/upload
   ↓
Backend:
   ├─→ Validates JWT
   ├─→ Validates file
   ├─→ Uploads to Backblaze B2
   ├─→ Saves metadata to PostgreSQL
   └─→ Returns book object
   ↓
React Query mutation succeeds
   ↓
Cache invalidated → Refetch books list
   ↓
Dialog closes with success message
   ↓
Library page displays new book
```

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Generate test coverage report
npm test:coverage

# Copy PDF.js worker (runs automatically on install)
npm run postinstall
```

---

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `APP_BASE_URL` | Base URL of the application | Yes | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `http://localhost:3001` |
| `AUTH0_SECRET` | Secret for session encryption | Yes | Generate with `openssl rand -hex 32` |
| `AUTH0_DOMAIN` | Auth0 tenant domain | Yes | `your-tenant.auth0.com` |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | Yes | `abc123xyz789` |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | Yes | From Auth0 dashboard |
| `AUTH0_AUDIENCE` | Auth0 API identifier | Yes | `https://booksreader-api` |
| `NEXT_PUBLIC_IMAGE_DOMAINS` | Allowed image domains (comma-separated) | No | `images.example.com,cdn.example.com` |

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with clear commit messages
4. Add tests for new features
5. Ensure all tests pass: `npm test`
6. Run linter: `npm run lint`
7. Submit a pull request

---

## Support

For issues, questions, or feature requests:
- Open an issue on [GitHub](https://github.com/1arunjyoti/BooksReader/issues)
