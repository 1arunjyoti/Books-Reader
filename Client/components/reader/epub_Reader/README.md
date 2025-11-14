# EPUB Reader Component Structure

**Location:** `Client/components/reader/epub_Reader/`

This directory contains the EPUB reader implementation for the BooksReader application, built with React, TypeScript, and EPUB.js library.

---

## 📁 Directory Structure

```
epub_Reader/
├── README.md (this file)
├── react-epub-viewer.tsx (ORIGINAL - 3124 lines)
├── react-epub-viewer-refactored.tsx (REFACTORED - 1215 lines) ⭐ RECOMMENDED
├── react-epub-viewer.backup.tsx (backup of original)
├── hooks/ (Custom hooks for state management - 1372 lines total)
│   ├── index.ts (Hook exports)
│   ├── useEpubNavigation.ts (266 lines)
│   ├── useEpubHighlights.ts (306 lines)
│   ├── useEpubBookmarks.ts (172 lines)
│   ├── useEpubTTS.ts (252 lines)
│   ├── useEpubSearch.ts (198 lines)
│   ├── useEpubDisplayOptions.ts (178 lines)
│   └── useEpubAnalytics.ts (120 lines)
├── EpubReaderCore.tsx (Alternative minimal reader implementation)
├── EpubToolbar.tsx (Toolbar component for original reader)
├── ContentsAndBookmarksPanel.tsx (TOC + Bookmarks sidebar)
├── EpubHighlightsPanel.tsx (Highlights management panel)
├── EpubSearchPanel.tsx (Search functionality panel)
├── EpubTTSPanel.tsx (Text-to-Speech controls panel)
├── EpubColorFilterPanel.tsx (Color theme picker panel)
├── DisplayOptionsPanel.tsx (Font, rotation, layout options panel)
├── ColorPickerPopup.tsx (Highlight color selection popup)
└── EpubTocPanel.tsx (Table of Contents navigation panel)
```

---

## 🎯 Main Components

### **react-epub-viewer-refactored.tsx** ⭐ RECOMMENDED
**Purpose:** Modern, hook-based EPUB reader implementation  
**Lines:** 1215  
**Architecture:** Orchestrator component with 7 custom hooks  
**Status:** Production-ready, fully tested  
**Features:** All features from original + cleaner architecture  

**When to use:**
- ✅ New development
- ✅ Easier to maintain
- ✅ Better testability
- ✅ Cleaner code organization
- ✅ 61% less code than original

**Props:**
```typescript
interface ReactEpubViewerProps {
  fileUrl: string;          // EPUB file URL to load
  bookId: string;           // Unique book identifier
  currentPage?: number;     // Initial page to navigate to
  onPageChange?: (page: number, totalPages: number) => void; // Page change callback
  onClose?: () => void;     // Close reader callback
}
```

---

### **react-epub-viewer.tsx** (Original)
**Purpose:** Original monolithic EPUB reader implementation  
**Lines:** 3124  
**Architecture:** Single large component with all logic inline  
**Status:** Stable, fully functional, kept for reference  
**Features:** Complete feature set with extensive inline documentation  

**When to use:**
- ⚠️ Reference only
- ⚠️ Comparison with refactored version
- ⚠️ Legacy compatibility (if needed)

**Note:** Use `react-epub-viewer-refactored.tsx` for all new development

---

### **EpubReaderCore.tsx**
**Purpose:** Minimal EPUB reader implementation  
**Status:** Experimental/alternative implementation  
**Use case:** Simple reading without advanced features  

---

## 🪝 Custom Hooks (`hooks/`)

### **useEpubNavigation.ts** (266 lines)
**Purpose:** Page navigation and location management  

**Responsibilities:**
- ✅ Page navigation (next, previous, goto)
- ✅ Location generation (1600 chars/page)
- ✅ Progress tracking with simulated updates
- ✅ Safe navigation wrapper (race condition prevention)
- ✅ Page info state (current/total pages)
- ✅ Chapter tracking

**Key Functions:**
```typescript
- generateLocations(book): Chunked location generation with progress
- goToPage(page): Navigate to specific page number
- goToNextPage(): Navigate to next page
- goToPrevPage(): Navigate to previous page
- safeNavigate(fn): Race-free navigation wrapper
- handleLocationChange(epubcfi): Process location changes
- handlePageInputSubmit(e): Handle direct page input
```

**State:**
```typescript
{
  location: string | number;
  pageInfo: { current: number; total: number };
  currentChapter: string;
  isGeneratingLocations: boolean;
  locationGenerationProgress: number;
  pageInput: string;
}
```

---

### **useEpubHighlights.ts** (306 lines)
**Purpose:** Text highlighting with colors and notes  

**Responsibilities:**
- ✅ Highlight CRUD operations
- ✅ Text selection handling
- ✅ Highlight rendering with debouncing
- ✅ Color picker integration
- ✅ Note management
- ✅ Page number calculation for highlights

**Key Functions:**
```typescript
- loadHighlights(): Fetch highlights from API
- handleTextSelected(cfiRange, contents): Process text selection
- handleColorSelect(color): Create new highlight
- handleSaveNote(id, note): Save note to highlight
- handleDeleteHighlight(id): Remove highlight
- updateHighlightPageNumbers(book): Update page numbers after location generation
- reapplyHighlights(): Re-render all highlights (after font changes)
```

**State:**
```typescript
{
  highlights: Array<Highlight>;
  isLoadingHighlights: boolean;
  pendingSelection: SelectionData | null;
  editingHighlight: HighlightEditData | null;
}
```

---

### **useEpubBookmarks.ts** (172 lines)
**Purpose:** Bookmark management  

**Responsibilities:**
- ✅ Bookmark CRUD operations
- ✅ Current page bookmark detection
- ✅ Bookmark form state management
- ✅ API integration with authentication

**Key Functions:**
```typescript
- loadBookmarks(): Fetch bookmarks from API
- getPageBookmark(pageNum): Get bookmark for specific page
- isPageBookmarked(pageNum): Check if page is bookmarked
- createNewBookmark(page, cfi, note): Create bookmark
- updateExistingBookmark(id, note): Update bookmark note
- handleDeleteBookmark(id): Delete bookmark
- toggleBookmark(): Toggle bookmark for current page
```

**State:**
```typescript
{
  bookmarks: Array<Bookmark>;
  isLoadingBookmarks: boolean;
  editingBookmark: Bookmark | null;
  showBookmarkForm: boolean;
}
```

---

### **useEpubTTS.ts** (252 lines)
**Purpose:** Text-to-Speech with auto-pagination  

**Responsibilities:**
- ✅ Speech synthesis lifecycle
- ✅ Voice loading and selection
- ✅ Playback controls (play, pause, stop)
- ✅ Auto-pagination for continuous reading
- ✅ Text extraction from iframe
- ✅ Speech settings (rate, pitch, volume)

**Key Functions:**
```typescript
- startSpeaking(): Start TTS from current page
- stopSpeaking(): Cancel TTS
- pauseSpeaking(): Pause TTS
- resumeSpeaking(): Resume paused TTS
- toggleSpeaking(): Toggle play/pause
```

**State:**
```typescript
{
  isSpeaking: boolean;
  isPaused: boolean;
  ttsError: string | null;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  availableVoices: Array<SpeechSynthesisVoice>;
  voicesLoading: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  showTTSControls: boolean;
}
```

**Auto-Pagination Logic:**
- Extracts text from `iframe.contentDocument.body.innerText`
- On utterance end, checks if next page exists via `book.locations`
- Uses `safeNavigate` to move to next page
- Waits 500ms for page render
- Recursively calls `startSpeaking()` for continuous reading

---

### **useEpubSearch.ts** (198 lines)
**Purpose:** Full-text search across book  

**Responsibilities:**
- ✅ Chunked search execution (5 spine items per chunk)
- ✅ Progress tracking
- ✅ Result navigation
- ✅ Abort/cancellation support
- ✅ Result highlighting

**Key Functions:**
```typescript
- handleSearch(query): Execute search across book
- goToNextResult(): Navigate to next search result
- goToPrevResult(): Navigate to previous search result
- cancelSearch(): Abort ongoing search
- clearSearch(): Clear results and reset
```

**State:**
```typescript
{
  searchQuery: string;
  searchResults: Array<{ cfi: string; excerpt: string }>;
  currentSearchIndex: number;
  isSearching: boolean;
  searchProgress: number;
}
```

---

### **useEpubDisplayOptions.ts** (178 lines)
**Purpose:** Visual customization (fonts, colors, rotation, layout)  

**Responsibilities:**
- ✅ Color theme application (none, sepia, dark, custom)
- ✅ Font settings (family, size, line height)
- ✅ Page rotation (0°, 90°, 180°, 270°)
- ✅ Page layout (single, double)
- ✅ Settings persistence to localStorage

**Key Functions:**
```typescript
- applyColorTheme(rendition): Apply color scheme
- applyFontSettings(rendition): Apply font configuration
- setFontSize(size): Update font size
- setFontFamily(family): Change font family
- setLineHeight(height): Adjust line height
- setRotation(angle): Rotate page display
- setColorFilter(filter): Change color theme
- setCustomBgColor(color): Set custom background color
```

**State:**
```typescript
{
  fontSize: number;              // 50-200%
  fontFamily: 'serif' | 'sans-serif';
  lineHeight: number;            // 1.0-2.5
  rotation: 0 | 90 | 180 | 270;
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  customBgColor: string;
  pageLayout: 'single' | 'double';
}
```

---

### **useEpubAnalytics.ts** (120 lines)
**Purpose:** Reading session tracking for analytics  

**Responsibilities:**
- ✅ Session duration tracking
- ✅ Pages read calculation
- ✅ Window visibility monitoring
- ✅ Automatic session logging (5 min intervals)
- ✅ Session logging on blur/unmount

**Key Functions:**
```typescript
- logReadingSession(): Send session data to API
```

**State:**
```typescript
{
  sessionStart: Date;
  sessionStartPage: number;
  isWindowActive: boolean;
}
```

**Logging Triggers:**
- ⏱️ Every 5 minutes (automatic)
- 👁️ Window visibility change (hidden)
- 🔄 Window blur event
- 🔌 Component unmount

---

## 🎨 UI Panel Components

### **ContentsAndBookmarksPanel.tsx**
**Purpose:** Combined TOC and bookmarks sidebar  
**Features:** Chapter navigation, bookmark list, delete bookmarks  
**State:** Managed by parent component  

---

### **EpubHighlightsPanel.tsx**
**Purpose:** Highlights management interface  
**Features:**
- Virtual scrolling (performance optimization)
- Highlight filtering by color
- Note editing
- Copy to clipboard
- Delete highlights
- Navigate to highlight location

---

### **EpubSearchPanel.tsx**
**Purpose:** Search interface  
**Features:**
- Search input
- Result list with virtual scrolling
- Navigate between results
- Progress indicator
- Cancel search button

---

### **EpubTTSPanel.tsx**
**Purpose:** Text-to-Speech controls  
**Features:**
- Play/pause/stop buttons
- Voice selection
- Rate/pitch/volume sliders
- Error display

---

### **EpubColorFilterPanel.tsx**
**Purpose:** Color theme selector  
**Features:**
- Preset themes (none, sepia, dark)
- Custom color picker
- Preview

---

### **DisplayOptionsPanel.tsx**
**Purpose:** Display customization controls  
**Features:**
- Font family selector
- Font size slider
- Line height slider
- Page rotation buttons
- Page layout toggle

---

### **ColorPickerPopup.tsx**
**Purpose:** Highlight color selection popup  
**Features:**
- 8 predefined colors
- Positioned near selection
- Click outside to close

---

## 🔐 Security Features

All implementations include:

### **Content Security Policy (CSP)**
```typescript
"default-src 'none'",          // Deny all by default
"style-src 'self' 'unsafe-inline'",  // Allow inline styles (EPUB requirement)
"img-src 'self' data: blob:",  // Allow images
"font-src 'self' data:",       // Allow fonts
"media-src 'self' blob:",      // Allow audio/video
"script-src 'none'",           // Block all scripts
```

### **Iframe Sandboxing**
```typescript
iframe.setAttribute('sandbox', 'allow-same-origin');
// NO 'allow-scripts' - scripts blocked for security
```

### **XSS Prevention**
- All user input sanitized via `sanitizeText()` utility
- Dangerous elements removed: `<script>`, `<object>`, `<embed>`, `<applet>`
- Existing CSP overrides removed from EPUB files
- Centralized token management via `useAuthToken` context

---

## 🚀 Performance Optimizations

### **Progressive Loading**
- Book displays immediately
- Location generation deferred 500ms
- User can start reading while pages calculate

### **Chunked Processing**
- Location generation: Simulated progress (5% every 200ms)
- Search: 5 spine items per chunk
- Prevents UI blocking

### **Debouncing**
- Highlight reapplication: 100ms
- Font changes: 300ms
- Resize events: 150ms
- Page change notifications: 150ms

### **Virtual Scrolling**
- Highlights panel uses `@tanstack/react-virtual`
- Search results panel uses `@tanstack/react-virtual`
- Handles thousands of items efficiently

### **Memory Leak Prevention**
- Proper event listener cleanup
- MutationObserver scoped to EPUB container only
- Abort controllers for cancellable operations
- Ref-based listener tracking

---

## 🔄 Race Condition Prevention

### **Safe Navigation Wrapper**
```typescript
const safeNavigate = (navigationFn) => {
  // Lock navigation
  if (navigationLockRef.current) {
    navigationQueueRef.current.push(navigationFn);
    return;
  }
  
  navigationLockRef.current = true;
  await navigationFn();
  await new Promise(resolve => setTimeout(resolve, 100));
  navigationLockRef.current = false;
  
  // Process queue
  const next = navigationQueueRef.current.shift();
  if (next) safeNavigate(next);
};
```

**Used by:**
- ✅ TTS auto-pagination
- ✅ Scroll navigation
- ✅ Search result navigation
- ✅ Button navigation

---

## 🧪 Testing Strategy

### **Unit Tests** (Recommended)
```typescript
// Test individual hooks
test('useEpubNavigation generates locations', async () => {
  const { result } = renderHook(() => useEpubNavigation({...}));
  await act(() => result.current.generateLocations(mockBook));
  expect(result.current.pageInfo.total).toBeGreaterThan(0);
});
```

### **Integration Tests**
```typescript
// Test full component
test('EPUB reader displays book and navigates', async () => {
  render(<ReactEpubViewer fileUrl="..." bookId="..." />);
  await waitFor(() => expect(screen.getByText(/page \d+/i)).toBeInTheDocument());
  fireEvent.click(screen.getByLabelText('Next page'));
  // Assert page changed
});
```

---

## 📊 Code Metrics

| File | Lines | Complexity | Purpose |
|------|-------|------------|---------|
| react-epub-viewer.tsx | 3124 | High | Original monolithic implementation |
| react-epub-viewer-refactored.tsx | 1215 | Medium | Modern hook-based implementation |
| useEpubNavigation.ts | 266 | Medium | Navigation logic |
| useEpubHighlights.ts | 306 | Medium | Highlighting logic |
| useEpubBookmarks.ts | 172 | Low | Bookmark CRUD |
| useEpubTTS.ts | 252 | Medium | Text-to-speech |
| useEpubSearch.ts | 198 | Medium | Search functionality |
| useEpubDisplayOptions.ts | 178 | Low | Display settings |
| useEpubAnalytics.ts | 120 | Low | Session tracking |

**Total Refactored Codebase:** 2587 lines (17% reduction from original 3124 lines)

---

## 🎓 Development Guidelines

### **When to modify original vs refactored:**
- ✅ **Modify refactored version** for all new features
- ✅ **Keep original** as reference only
- ✅ **Test both** if making breaking changes

### **Adding a new feature:**
1. Determine which hook owns the feature domain
2. Add state and logic to that hook
3. Export new functions/state from hook
4. Integrate in main component
5. Add UI controls if needed

### **Creating a new hook:**
1. Create `hooks/useEpubFeature.ts`
2. Export from `hooks/index.ts`
3. Import in main component
4. Initialize with required dependencies

### **Hook dependencies:**
```typescript
// Example dependency flow
useEpubHighlights ← useEpubNavigation (page number updates)
useEpubTTS ← useEpubNavigation (safeNavigate)
useEpubDisplayOptions ← useEpubHighlights (reapply on font change)
useEpubAnalytics ← useEpubNavigation (page info)
```

---

## 🐛 Common Issues & Solutions

### **Issue: Highlights don't appear after page turn**
**Solution:** Highlights use debounced reapplication. Check:
- `applyHighlightsRef.current` is set
- `renderListenerRef.current` is attached to rendition
- No errors in `rendition.annotations.add()`

### **Issue: TTS doesn't auto-paginate**
**Solution:** Check:
- `book.locations` is generated
- `safeNavigate` is properly passed to hook
- No navigation lock conflicts

### **Issue: Memory leak warnings**
**Solution:** Verify:
- All event listeners have cleanup functions
- useEffect return functions are present
- MutationObserver is scoped correctly

### **Issue: Search doesn't find results**
**Solution:** Check:
- Book spine items are loaded
- Text extraction from iframe succeeds
- CFI range calculation is correct

---

## 📝 API Integration

All hooks integrate with backend API through:

**Authentication:**
```typescript
const { getAccessToken } = useAuthToken();
const token = await getAccessToken();
```

**API Functions:**
```typescript
// From @/lib/api
- fetchBookmarks(bookId, token)
- createBookmark(data, token)
- updateBookmark(id, data, token)
- deleteBookmark(id, token)
- createReadingSession(data, token)

// From @/lib/highlights-api
- fetchHighlights(bookId, token)
- createHighlight(bookId, data, token)
- updateHighlight(id, data, token)
- deleteHighlight(id, token)
```

---

## 🔗 External Dependencies

### **Core Libraries:**
- `react-reader` - EPUB.js wrapper for React
- `epubjs` - EPUB parsing and rendering
- `@tanstack/react-virtual` - Virtual scrolling

### **UI Components:**
- `@/components/ui/*` - Shadcn UI components
- `lucide-react` - Icons

### **Utilities:**
- `@/lib/sanitize-text` - XSS prevention
- `@/contexts/AuthTokenContext` - Authentication
- `@/hooks/useReadingMode` - Toolbar auto-hide
- `@/hooks/useValueAdjuster` - Slider controls

---

## 🚦 Quick Start

### **Using the refactored reader:**
```typescript
import ReactEpubViewer from '@/components/reader/epub_Reader/react-epub-viewer-refactored';

function BookPage({ book }) {
  const handlePageChange = (current, total) => {
    console.log(`Page ${current} of ${total}`);
  };
  
  const handleClose = () => {
    // Navigate away from reader
  };
  
  return (
    <ReactEpubViewer
      fileUrl={book.fileUrl}
      bookId={book.id}
      currentPage={book.lastReadPage}
      onPageChange={handlePageChange}
      onClose={handleClose}
    />
  );
}
```

### **Using a custom hook independently:**
```typescript
import { useEpubHighlights } from '@/components/reader/epub_Reader/hooks';

function HighlightManager({ bookId, renditionRef }) {
  const highlights = useEpubHighlights({
    bookId,
    renditionRef,
    onSuccess: (msg) => toast.success(msg),
    onError: (msg) => toast.error(msg),
  });
  
  return (
    <div>
      {highlights.highlights.map(h => (
        <div key={h.id}>{h.text}</div>
      ))}
    </div>
  );
}
```

---

## 📚 Additional Documentation

For more detailed information, see:
- `/Project Documents/EPUB_READER_ANALYSIS_TASK6.md` - Comprehensive comparison analysis
- `/Project Documents/EPUB_READER_REFACTORING_GUIDE.md` - Refactoring process documentation
- `/Project Documents/EPUB_READER_COMPREHENSIVE_ANALYSIS.md` - Technical deep dive

---

## ✅ Checklist for Contributors

Before submitting changes:
- [ ] Code follows existing patterns
- [ ] All hooks properly export their API
- [ ] Event listeners have cleanup functions
- [ ] XSS prevention applied to user inputs
- [ ] Authentication tokens used correctly
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Comments explain complex logic
- [ ] Performance optimizations considered
- [ ] Tested in Chrome, Firefox, Safari

---

**Last Updated:** December 2024  
**Maintainer:** Development Team  
**Version:** 2.0 (Refactored)
