# TXT Reader Component

## Overview
The TXT Reader is a comprehensive text file viewer component for the BooksReader application. It provides a rich reading experience with features like highlighting, search, text-to-speech, and customizable display options.

## File Structure

```
txt_Reader/
├── README.md                      # This file - documentation
├── txt-viewer.tsx                 # Main viewer component (entry point)
├── ColorPickerPopup.tsx           # Color selection popup for highlights
├── TxtToolbar.tsx                 # Top navigation toolbar
├── TxtSearchPanel.tsx             # Search functionality panel
├── TxtHighlightsPanel.tsx         # Highlights management panel
├── TxtDisplayOptionsPanel.tsx     # Display customization panel
├── TxtTTSPanel.tsx                # Text-to-Speech controls panel
└── hooks/                         # Custom React hooks directory
    ├── useTxtFileLoader.ts        # File loading and section management
    ├── useTxtDisplayOptions.ts    # Display settings (font, colors, layout)
    ├── useTxtHighlights.ts        # Highlight CRUD operations
    ├── useTxtSearch.ts            # Search functionality
    ├── useTxtTTS.ts               # Text-to-Speech functionality
    └── useTxtKeyboardShortcuts.ts # Keyboard shortcuts handler
```

## Component Descriptions

### Main Component

#### `txt-viewer.tsx`
**Purpose**: Main entry point for the TXT reader component. Orchestrates all sub-components and hooks.

**Key Features**:
- Integrates all custom hooks for modular functionality
- Manages panel visibility states (search, highlights, display options, TTS)
- Handles text selection for highlighting
- Renders sections with highlights and search results
- Provides error handling and loading states

**Props**:
- `fileUrl`: URL of the text file to display
- `bookId`: Unique identifier for the book
- `currentPage`: Current page/section number (optional)
- `onPageChange`: Callback when page/section changes (optional)
- `onClose`: Callback to close the viewer (optional)

---

### UI Panels

#### `TxtToolbar.tsx`
**Purpose**: Top navigation bar with controls for all reader features.

**Features**:
- Toggle buttons for search, highlights, display options, and TTS panels
- Highlight mode toggle
- Fullscreen mode toggle
- Close button
- Displays highlight count badge

#### `TxtSearchPanel.tsx`
**Purpose**: Side panel for searching text within the document.

**Features**:
- Search input with query validation
- Results navigation (previous/next)
- Result counter display
- Progress indicator during search
- Result preview with context
- Click to jump to result

#### `TxtHighlightsPanel.tsx`
**Purpose**: Side panel for managing user highlights.

**Features**:
- List view of all highlights
- Color-coded highlight display
- Jump to highlight location
- Edit highlight notes
- Change highlight color
- Delete highlights
- Loading state for async operations

#### `TxtDisplayOptionsPanel.tsx`
**Purpose**: Side panel for customizing text display.

**Features**:
- Font size adjustment (10-32px)
- Line height adjustment (1.0-2.5)
- Font family cycling (serif/sans-serif/monospace)
- Text alignment (left/center/justify)
- Color filters (none/sepia/dark/custom)
- Custom background color picker

#### `TxtTTSPanel.tsx`
**Purpose**: Side panel for text-to-speech controls.

**Features**:
- Voice selection from available system voices
- Speech rate control (0.5-2.0x)
- Pitch adjustment (0.5-2.0)
- Volume control (0-1.0)
- Play/pause/stop controls
- Current section indicator
- Auto-advance to next section

#### `ColorPickerPopup.tsx`
**Purpose**: Popup component for selecting highlight colors.

**Features**:
- 6 predefined color options (yellow, green, pink, blue, orange, purple)
- Appears at mouse cursor position after text selection
- Click outside to dismiss
- Visual color preview

---

## Custom Hooks

### `useTxtFileLoader.ts`
**Purpose**: Handles loading, parsing, and section management of text files.

**Functionality**:
- Fetches text file from URL
- Validates file size (max 50MB security check)
- Splits content into manageable sections (~5000 chars each)
- Tracks current visible section with Intersection Observer
- Manages section refs for scroll navigation
- Handles loading and error states

**Returns**:
- `sections`: Array of text sections
- `currentSection`: Index of currently visible section
- `setCurrentSection`: Function to change current section
- `isLoading`: Loading state
- `error`: Error message (if any)
- `sectionRefs`: Refs array for section DOM elements
- `scrollContainerRef`: Ref for scroll container

---

### `useTxtDisplayOptions.ts`
**Purpose**: Manages all display customization settings.

**Functionality**:
- Font size management with increment/decrement
- Line height adjustment
- Font family selection (serif/sans-serif/monospace)
- Text alignment (left/center/right/justify)
- Color filter presets (none/sepia/dark/custom)
- Custom background and text colors
- Fullscreen mode toggle
- Computed styles based on current settings

**Returns**:
- Font settings: `fontSize`, `fontFamily`, `lineHeight`, `textAlign`
- Font adjusters: `increaseFontSize`, `decreaseFontSize`, etc.
- Color settings: `colorFilter`, `customBgColor`, `customTextColor`
- Computed colors: `getBackgroundColor`, `getTextColor`
- Fullscreen: `isFullscreen`, `toggleFullscreen`

---

### `useTxtHighlights.ts`
**Purpose**: Manages all highlight-related operations (CRUD).

**Functionality**:
- Loads highlights from API on mount
- Creates new highlights with position tracking
- Updates highlight color and notes
- Deletes highlights
- Jumps to highlight location in document
- Handles pending selections for color picker
- Parses and stores TXT-specific position data in `cfiRange`

**API Integration**:
- `GET /api/highlights/:bookId` - Load highlights
- `POST /api/highlights` - Create highlight
- `PUT /api/highlights/:id` - Update highlight
- `DELETE /api/highlights/:id` - Delete highlight

**Returns**:
- `highlights`: Array of highlight objects
- `isLoadingHighlights`: Loading state
- `pendingSelection`: Current text selection pending highlight
- `setPendingSelection`: Function to set pending selection
- `handleColorSelect`: Create/update highlight with color
- `handleRemoveHighlight`: Delete a highlight
- `handleJumpToHighlight`: Scroll to highlight location
- `handleSaveNote`: Save note for a highlight
- `handleChangeColor`: Open color picker to change highlight color

---

### `useTxtSearch.ts`
**Purpose**: Implements full-text search functionality.

**Functionality**:
- Case-insensitive search across all sections
- Query validation (max 200 chars for security)
- Result limiting (max 500 results for performance)
- Excerpt generation with context
- Navigation between results (next/prev)
- Progress tracking during search
- Auto-scroll to results

**Returns**:
- `searchQuery`: Current search query
- `setSearchQuery`: Update search query
- `searchResults`: Array of search results
- `currentSearchIndex`: Index of current result
- `setCurrentSearchIndex`: Navigate to specific result
- `isSearching`: Search in progress state
- `searchProgress`: Search progress percentage
- `handleSearch`: Execute search
- `goToNextSearchResult`: Navigate to next result
- `goToPrevSearchResult`: Navigate to previous result
- `clearSearch`: Clear all search data

---

### `useTxtTTS.ts`
**Purpose**: Implements text-to-speech functionality using Web Speech API.

**Functionality**:
- Initializes speech synthesis
- Loads available system voices
- Manages playback state (playing/paused)
- Controls speech parameters (rate/pitch/volume)
- Auto-advances to next section after completion
- Error handling for TTS failures

**Returns**:
- Voice settings: `availableVoices`, `selectedVoice`, `setSelectedVoice`
- Speech controls: `speechRate`, `speechPitch`, `speechVolume` (with setters)
- Playback state: `isSpeaking`, `isPaused`
- Control functions: `toggleTextToSpeech`, `stopTextToSpeech`
- Status: `ttsError`, `voicesLoading`

---

### `useTxtKeyboardShortcuts.ts`
**Purpose**: Handles keyboard shortcuts for quick actions.

**Functionality**:
- Listens for Ctrl+1-6 key combinations
- Validates text selection before action
- Triggers highlight creation with predefined colors
- Only active when text selection mode is enabled

**Shortcuts**:
- `Ctrl+1`: Yellow highlight
- `Ctrl+2`: Green highlight
- `Ctrl+3`: Pink highlight
- `Ctrl+4`: Blue highlight
- `Ctrl+5`: Orange highlight
- `Ctrl+6`: Purple highlight

**Parameters**:
- `enableTextSelection`: Whether shortcuts are active
- `onColorSelect`: Callback when color is selected

---

## Architecture Patterns

### Hook-Based Architecture
The component follows a **modular hook-based architecture** where:
1. Each major feature is encapsulated in a custom hook
2. The main component (`txt-viewer.tsx`) orchestrates these hooks
3. Hooks handle their own state and side effects
4. Separation of concerns makes testing and maintenance easier

### State Management
- **Local State**: Panel visibility managed in main component
- **Hook State**: Feature-specific state managed in respective hooks
- **Ref Management**: DOM refs passed to hooks that need them
- **Memoization**: Performance optimization using `useMemo` for expensive operations

### API Integration
- Uses authenticated API calls via `useAuthToken` context
- Implements proper error handling and loading states
- Supports graceful degradation (404 means no data, not error)
- Secure request cancellation to prevent memory leaks

---

## Security Features

1. **File Size Validation**: Max 50MB for text files
2. **Input Validation**: 
   - Search query max 200 chars
   - Highlight text 3-5000 chars
   - Position data validation
3. **Request Cancellation**: Abort controllers for cleanup
4. **Authentication**: All highlight operations require auth token
5. **XSS Prevention**: Text sanitization for error messages

---

## Performance Optimizations

1. **Section Splitting**: Large files split into ~5000 char sections
2. **Intersection Observer**: Efficient scroll-based section tracking
3. **Memoization**: Render-heavy operations cached with `useMemo`
4. **Search Limiting**: Max 500 results to prevent UI lag
5. **Lazy Panel Rendering**: Panels only render when visible
6. **Ref-Based Navigation**: Direct DOM access for smooth scrolling

---

## Usage Example

```tsx
import TxtViewer from '@/components/reader/txt_Reader/txt-viewer';

function BookPage() {
  return (
    <TxtViewer
      fileUrl="https://example.com/book.txt"
      bookId="123"
      currentPage={0}
      onPageChange={(page) => console.log('Page changed:', page)}
      onClose={() => console.log('Viewer closed')}
    />
  );
}
```

---

## Dependencies

- **React**: Core framework
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling
- **Web Speech API**: Text-to-speech functionality
- **Intersection Observer API**: Scroll tracking

---

## Future Improvements

- [ ] Virtual scrolling for massive files
- [ ] Offline mode with local storage
- [ ] Collaborative highlighting
- [ ] Export highlights as PDF/Markdown
- [ ] Custom keyboard shortcut configuration
- [ ] Reading statistics and analytics
- [ ] Night mode auto-scheduling
- [ ] Font preview before selection

---

## Contributing

When modifying the TXT reader:
1. Keep hooks focused on single responsibilities
2. Update this README if adding/removing files
3. Maintain type safety with TypeScript
4. Add error handling for all async operations
5. Test with various file sizes and formats
6. Ensure accessibility (ARIA labels, keyboard navigation)

---

## License

Part of the BooksReader application.
