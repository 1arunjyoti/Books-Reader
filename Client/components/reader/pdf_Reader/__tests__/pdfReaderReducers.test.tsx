/**
 * Unit Tests for PDF Reader Reducers
 * 
 * Tests all four reducers:
 * - viewerReducer: Page navigation, zoom, rotation, PDF document
 * - uiReducer: Fullscreen, text selection, color filters, panels
 * - dataReducer: Bookmarks and highlights CRUD operations
 * - sessionReducer: Session tracking and window activity
 */

import {
  viewerReducer,
  uiReducer,
  dataReducer,
  sessionReducer,
  type ViewerState,
  type ViewerAction,
  type UIState,
  type UIAction,
  type DataState,
  type DataAction,
  type SessionState,
  type SessionAction,
} from '@/components/reader/pdf_Reader/pdfReaderReducers';
import type { PdfHighlight } from '@/types/highlights';
import type { Bookmark } from '@/lib/api';

// ==================== Test Helpers ====================

const createMockPdfHighlight = (overrides?: Partial<PdfHighlight>): PdfHighlight => ({
  id: 'highlight-123',
  pageNumber: 1,
  text: 'Sample highlighted text',
  note: 'Sample note',
  color: 'yellow',
  hex: '#ffff00',
  source: 'PDF',
  rects: [
    {
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.05,
      pageNumber: 1,
    },
  ],
  boundingRect: {
    x: 0.1,
    y: 0.2,
    width: 0.3,
    height: 0.05,
    pageNumber: 1,
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createMockBookmark = (overrides?: Partial<Bookmark>): Bookmark => ({
  id: 'bookmark-123',
  bookId: 'book-456',
  userId: 'user-789',
  pageNumber: 10,
  note: 'Sample bookmark note',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// ==================== Viewer Reducer Tests ====================

describe('viewerReducer', () => {
  const initialState: ViewerState = {
    currentPage: 1,
    numPages: 0,
    pageInput: '1',
    scale: 1.5,
    rotation: 0,
    pdfDoc: null,
  };

  describe('SET_CURRENT_PAGE', () => {
    it('should update current page and page input', () => {
      const action: ViewerAction = { type: 'SET_CURRENT_PAGE', payload: 5 };
      const newState = viewerReducer(initialState, action);

      expect(newState.currentPage).toBe(5);
      expect(newState.pageInput).toBe('5');
      expect(newState).not.toBe(initialState); // Immutability check
    });

    it('should handle page 1', () => {
      const state = { ...initialState, currentPage: 10 };
      const action: ViewerAction = { type: 'SET_CURRENT_PAGE', payload: 1 };
      const newState = viewerReducer(state, action);

      expect(newState.currentPage).toBe(1);
      expect(newState.pageInput).toBe('1');
    });

    it('should handle large page numbers', () => {
      const action: ViewerAction = { type: 'SET_CURRENT_PAGE', payload: 999 };
      const newState = viewerReducer(initialState, action);

      expect(newState.currentPage).toBe(999);
      expect(newState.pageInput).toBe('999');
    });
  });

  describe('SET_NUM_PAGES', () => {
    it('should update number of pages', () => {
      const action: ViewerAction = { type: 'SET_NUM_PAGES', payload: 150 };
      const newState = viewerReducer(initialState, action);

      expect(newState.numPages).toBe(150);
      expect(newState).not.toBe(initialState);
    });

    it('should handle zero pages', () => {
      const action: ViewerAction = { type: 'SET_NUM_PAGES', payload: 0 };
      const newState = viewerReducer(initialState, action);

      expect(newState.numPages).toBe(0);
    });
  });

  describe('SET_PAGE_INPUT', () => {
    it('should update page input string', () => {
      const action: ViewerAction = { type: 'SET_PAGE_INPUT', payload: '42' };
      const newState = viewerReducer(initialState, action);

      expect(newState.pageInput).toBe('42');
    });

    it('should allow empty string', () => {
      const action: ViewerAction = { type: 'SET_PAGE_INPUT', payload: '' };
      const newState = viewerReducer(initialState, action);

      expect(newState.pageInput).toBe('');
    });

    it('should allow non-numeric input (for validation)', () => {
      const action: ViewerAction = { type: 'SET_PAGE_INPUT', payload: 'abc' };
      const newState = viewerReducer(initialState, action);

      expect(newState.pageInput).toBe('abc');
    });
  });

  describe('SET_SCALE', () => {
    it('should update scale value', () => {
      const action: ViewerAction = { type: 'SET_SCALE', payload: 2.0 };
      const newState = viewerReducer(initialState, action);

      expect(newState.scale).toBe(2.0);
    });

    it('should allow minimum scale (0.5)', () => {
      const action: ViewerAction = { type: 'SET_SCALE', payload: 0.5 };
      const newState = viewerReducer(initialState, action);

      expect(newState.scale).toBe(0.5);
    });

    it('should allow maximum scale (3.0)', () => {
      const action: ViewerAction = { type: 'SET_SCALE', payload: 3.0 };
      const newState = viewerReducer(initialState, action);

      expect(newState.scale).toBe(3.0);
    });
  });

  describe('ADJUST_SCALE', () => {
    it('should increase scale by delta', () => {
      const action: ViewerAction = { type: 'ADJUST_SCALE', payload: 0.2 };
      const newState = viewerReducer(initialState, action);

      expect(newState.scale).toBe(1.7);
    });

    it('should decrease scale by negative delta', () => {
      const action: ViewerAction = { type: 'ADJUST_SCALE', payload: -0.3 };
      const newState = viewerReducer(initialState, action);

      expect(newState.scale).toBe(1.2);
    });

    it('should clamp to minimum scale (0.5)', () => {
      const state = { ...initialState, scale: 0.6 };
      const action: ViewerAction = { type: 'ADJUST_SCALE', payload: -0.5 };
      const newState = viewerReducer(state, action);

      expect(newState.scale).toBe(0.5);
    });

    it('should clamp to maximum scale (3.0)', () => {
      const state = { ...initialState, scale: 2.8 };
      const action: ViewerAction = { type: 'ADJUST_SCALE', payload: 0.5 };
      const newState = viewerReducer(state, action);

      expect(newState.scale).toBe(3.0);
    });

    it('should handle zero delta', () => {
      const action: ViewerAction = { type: 'ADJUST_SCALE', payload: 0 };
      const newState = viewerReducer(initialState, action);

      expect(newState.scale).toBe(1.5);
    });
  });

  describe('SET_ROTATION', () => {
    it('should set rotation value', () => {
      const action: ViewerAction = { type: 'SET_ROTATION', payload: 90 };
      const newState = viewerReducer(initialState, action);

      expect(newState.rotation).toBe(90);
    });

    it('should allow all valid rotations', () => {
      [0, 90, 180, 270].forEach((rotation) => {
        const action: ViewerAction = { type: 'SET_ROTATION', payload: rotation };
        const newState = viewerReducer(initialState, action);
        expect(newState.rotation).toBe(rotation);
      });
    });
  });

  describe('ROTATE', () => {
    it('should rotate by 90 degrees', () => {
      const action: ViewerAction = { type: 'ROTATE', payload: 90 };
      const newState = viewerReducer(initialState, action);

      expect(newState.rotation).toBe(90);
    });

    it('should wrap around after 360 degrees', () => {
      const state = { ...initialState, rotation: 270 };
      const action: ViewerAction = { type: 'ROTATE', payload: 90 };
      const newState = viewerReducer(state, action);

      expect(newState.rotation).toBe(0);
    });

    it('should handle negative rotation (counter-clockwise)', () => {
      const state = { ...initialState, rotation: 90 };
      const action: ViewerAction = { type: 'ROTATE', payload: -90 };
      const newState = viewerReducer(state, action);

      expect(newState.rotation).toBe(0);
    });

    it('should normalize negative values to positive', () => {
      const state = { ...initialState, rotation: 0 };
      const action: ViewerAction = { type: 'ROTATE', payload: -90 };
      const newState = viewerReducer(state, action);

      expect(newState.rotation).toBe(270);
    });

    it('should handle multiple rotations', () => {
      let state = initialState;
      for (let i = 0; i < 4; i++) {
        state = viewerReducer(state, { type: 'ROTATE', payload: 90 });
      }
      expect(state.rotation).toBe(0); // Full circle
    });
  });

  describe('SET_PDF_DOC', () => {
    it('should set PDF document proxy', () => {
      const mockDoc = { numPages: 50, fingerprints: ['abc123'] };
      const action: ViewerAction = { type: 'SET_PDF_DOC', payload: mockDoc };
      const newState = viewerReducer(initialState, action);

      expect(newState.pdfDoc).toBe(mockDoc);
    });

    it('should allow setting to null', () => {
      const state = { ...initialState, pdfDoc: { numPages: 10 } };
      const action: ViewerAction = { type: 'SET_PDF_DOC', payload: null };
      const newState = viewerReducer(state, action);

      expect(newState.pdfDoc).toBeNull();
    });
  });

  describe('INITIALIZE_PAGE', () => {
    it('should initialize page, numPages, and pageInput', () => {
      const action: ViewerAction = {
        type: 'INITIALIZE_PAGE',
        payload: { page: 25, numPages: 100 },
      };
      const newState = viewerReducer(initialState, action);

      expect(newState.currentPage).toBe(25);
      expect(newState.numPages).toBe(100);
      expect(newState.pageInput).toBe('25');
    });

    it('should initialize to first page', () => {
      const action: ViewerAction = {
        type: 'INITIALIZE_PAGE',
        payload: { page: 1, numPages: 50 },
      };
      const newState = viewerReducer(initialState, action);

      expect(newState.currentPage).toBe(1);
      expect(newState.numPages).toBe(50);
      expect(newState.pageInput).toBe('1');
    });
  });

  describe('Immutability', () => {
    it('should not mutate the original state', () => {
      const action: ViewerAction = { type: 'SET_CURRENT_PAGE', payload: 10 };
      const newState = viewerReducer(initialState, action);

      expect(initialState.currentPage).toBe(1);
      expect(initialState.pageInput).toBe('1');
      expect(newState).not.toBe(initialState);
    });
  });
});

// ==================== UI Reducer Tests ====================

describe('uiReducer', () => {
  const initialState: UIState = {
    isFullscreen: false,
    enableTextSelection: true,
    colorFilter: 'none',
    customBgColor: '#ffffff',
    panels: {
      contentsAndBookmarks: false,
      bookmarkForm: false,
      thumbnails: false,
      search: false,
      tts: false,
      displayOptions: false,
      highlights: false,
    },
  };

  describe('TOGGLE_FULLSCREEN', () => {
    it('should toggle fullscreen from false to true', () => {
      const action: UIAction = { type: 'TOGGLE_FULLSCREEN' };
      const newState = uiReducer(initialState, action);

      expect(newState.isFullscreen).toBe(true);
    });

    it('should toggle fullscreen from true to false', () => {
      const state = { ...initialState, isFullscreen: true };
      const action: UIAction = { type: 'TOGGLE_FULLSCREEN' };
      const newState = uiReducer(state, action);

      expect(newState.isFullscreen).toBe(false);
    });
  });

  describe('SET_FULLSCREEN', () => {
    it('should set fullscreen to true', () => {
      const action: UIAction = { type: 'SET_FULLSCREEN', payload: true };
      const newState = uiReducer(initialState, action);

      expect(newState.isFullscreen).toBe(true);
    });

    it('should set fullscreen to false', () => {
      const state = { ...initialState, isFullscreen: true };
      const action: UIAction = { type: 'SET_FULLSCREEN', payload: false };
      const newState = uiReducer(state, action);

      expect(newState.isFullscreen).toBe(false);
    });
  });

  describe('TOGGLE_TEXT_SELECTION', () => {
    it('should toggle text selection from true to false', () => {
      const action: UIAction = { type: 'TOGGLE_TEXT_SELECTION' };
      const newState = uiReducer(initialState, action);

      expect(newState.enableTextSelection).toBe(false);
    });

    it('should toggle text selection from false to true', () => {
      const state = { ...initialState, enableTextSelection: false };
      const action: UIAction = { type: 'TOGGLE_TEXT_SELECTION' };
      const newState = uiReducer(state, action);

      expect(newState.enableTextSelection).toBe(true);
    });
  });

  describe('SET_TEXT_SELECTION', () => {
    it('should set text selection to true', () => {
      const state = { ...initialState, enableTextSelection: false };
      const action: UIAction = { type: 'SET_TEXT_SELECTION', payload: true };
      const newState = uiReducer(state, action);

      expect(newState.enableTextSelection).toBe(true);
    });

    it('should set text selection to false', () => {
      const action: UIAction = { type: 'SET_TEXT_SELECTION', payload: false };
      const newState = uiReducer(initialState, action);

      expect(newState.enableTextSelection).toBe(false);
    });
  });

  describe('SET_COLOR_FILTER', () => {
    it('should set color filter to sepia', () => {
      const action: UIAction = { type: 'SET_COLOR_FILTER', payload: 'sepia' };
      const newState = uiReducer(initialState, action);

      expect(newState.colorFilter).toBe('sepia');
    });

    it('should set color filter to dark', () => {
      const action: UIAction = { type: 'SET_COLOR_FILTER', payload: 'dark' };
      const newState = uiReducer(initialState, action);

      expect(newState.colorFilter).toBe('dark');
    });

    it('should set color filter to custom', () => {
      const action: UIAction = { type: 'SET_COLOR_FILTER', payload: 'custom' };
      const newState = uiReducer(initialState, action);

      expect(newState.colorFilter).toBe('custom');
    });

    it('should set color filter back to none', () => {
      const state = { ...initialState, colorFilter: 'dark' as const };
      const action: UIAction = { type: 'SET_COLOR_FILTER', payload: 'none' };
      const newState = uiReducer(state, action);

      expect(newState.colorFilter).toBe('none');
    });
  });

  describe('SET_CUSTOM_BG_COLOR', () => {
    it('should set custom background color', () => {
      const action: UIAction = { type: 'SET_CUSTOM_BG_COLOR', payload: '#f0f0f0' };
      const newState = uiReducer(initialState, action);

      expect(newState.customBgColor).toBe('#f0f0f0');
    });

    it('should handle hex color with alpha', () => {
      const action: UIAction = { type: 'SET_CUSTOM_BG_COLOR', payload: '#f0f0f0aa' };
      const newState = uiReducer(initialState, action);

      expect(newState.customBgColor).toBe('#f0f0f0aa');
    });
  });

  describe('TOGGLE_PANEL', () => {
    it('should toggle highlights panel from false to true', () => {
      const action: UIAction = { type: 'TOGGLE_PANEL', payload: 'highlights' };
      const newState = uiReducer(initialState, action);

      expect(newState.panels.highlights).toBe(true);
    });

    it('should toggle search panel from false to true', () => {
      const action: UIAction = { type: 'TOGGLE_PANEL', payload: 'search' };
      const newState = uiReducer(initialState, action);

      expect(newState.panels.search).toBe(true);
    });

    it('should toggle panel from true to false', () => {
      const state = {
        ...initialState,
        panels: { ...initialState.panels, thumbnails: true },
      };
      const action: UIAction = { type: 'TOGGLE_PANEL', payload: 'thumbnails' };
      const newState = uiReducer(state, action);

      expect(newState.panels.thumbnails).toBe(false);
    });

    it('should only affect specified panel', () => {
      const state = {
        ...initialState,
        panels: { ...initialState.panels, search: true, highlights: true },
      };
      const action: UIAction = { type: 'TOGGLE_PANEL', payload: 'search' };
      const newState = uiReducer(state, action);

      expect(newState.panels.search).toBe(false);
      expect(newState.panels.highlights).toBe(true);
    });
  });

  describe('SET_PANEL', () => {
    it('should set panel to open', () => {
      const action: UIAction = {
        type: 'SET_PANEL',
        payload: { panel: 'bookmarkForm', open: true },
      };
      const newState = uiReducer(initialState, action);

      expect(newState.panels.bookmarkForm).toBe(true);
    });

    it('should set panel to closed', () => {
      const state = {
        ...initialState,
        panels: { ...initialState.panels, tts: true },
      };
      const action: UIAction = {
        type: 'SET_PANEL',
        payload: { panel: 'tts', open: false },
      };
      const newState = uiReducer(state, action);

      expect(newState.panels.tts).toBe(false);
    });
  });

  describe('CLOSE_ALL_PANELS', () => {
    it('should close all panels', () => {
      const state = {
        ...initialState,
        panels: {
          contentsAndBookmarks: true,
          bookmarkForm: true,
          thumbnails: true,
          search: true,
          tts: true,
          displayOptions: true,
          highlights: true,
        },
      };
      const action: UIAction = { type: 'CLOSE_ALL_PANELS' };
      const newState = uiReducer(state, action);

      expect(newState.panels.contentsAndBookmarks).toBe(false);
      expect(newState.panels.bookmarkForm).toBe(false);
      expect(newState.panels.thumbnails).toBe(false);
      expect(newState.panels.search).toBe(false);
      expect(newState.panels.tts).toBe(false);
      expect(newState.panels.displayOptions).toBe(false);
      expect(newState.panels.highlights).toBe(false);
    });

    it('should work when all panels are already closed', () => {
      const action: UIAction = { type: 'CLOSE_ALL_PANELS' };
      const newState = uiReducer(initialState, action);

      Object.values(newState.panels).forEach((isOpen) => {
        expect(isOpen).toBe(false);
      });
    });
  });

  describe('Immutability', () => {
    it('should not mutate the original state', () => {
      const action: UIAction = { type: 'TOGGLE_FULLSCREEN' };
      const newState = uiReducer(initialState, action);

      expect(initialState.isFullscreen).toBe(false);
      expect(newState).not.toBe(initialState);
    });

    it('should not mutate nested panels object', () => {
      const action: UIAction = { type: 'TOGGLE_PANEL', payload: 'search' };
      const newState = uiReducer(initialState, action);

      expect(initialState.panels.search).toBe(false);
      expect(newState.panels).not.toBe(initialState.panels);
    });
  });
});

// ==================== Data Reducer Tests ====================

describe('dataReducer', () => {
  const initialState: DataState = {
    bookmarks: [],
    highlights: [],
    isLoadingBookmarks: false,
    isLoadingHighlights: false,
    editingBookmark: null,
  };

  describe('SET_BOOKMARKS', () => {
    it('should set bookmarks array', () => {
      const bookmarks = [createMockBookmark(), createMockBookmark({ id: 'bookmark-456' })];
      const action: DataAction = { type: 'SET_BOOKMARKS', payload: bookmarks };
      const newState = dataReducer(initialState, action);

      expect(newState.bookmarks).toEqual(bookmarks);
      expect(newState.bookmarks).toHaveLength(2);
    });

    it('should replace existing bookmarks', () => {
      const state = {
        ...initialState,
        bookmarks: [createMockBookmark({ id: 'old-1' })],
      };
      const newBookmarks = [createMockBookmark({ id: 'new-1' })];
      const action: DataAction = { type: 'SET_BOOKMARKS', payload: newBookmarks };
      const newState = dataReducer(state, action);

      expect(newState.bookmarks).toEqual(newBookmarks);
      expect(newState.bookmarks).toHaveLength(1);
      expect(newState.bookmarks[0].id).toBe('new-1');
    });

    it('should handle empty array', () => {
      const state = {
        ...initialState,
        bookmarks: [createMockBookmark()],
      };
      const action: DataAction = { type: 'SET_BOOKMARKS', payload: [] };
      const newState = dataReducer(state, action);

      expect(newState.bookmarks).toEqual([]);
    });
  });

  describe('SET_HIGHLIGHTS', () => {
    it('should set highlights array', () => {
      const highlights = [
        createMockPdfHighlight(),
        createMockPdfHighlight({ id: 'highlight-456' }),
      ];
      const action: DataAction = { type: 'SET_HIGHLIGHTS', payload: highlights };
      const newState = dataReducer(initialState, action);

      expect(newState.highlights).toEqual(highlights);
      expect(newState.highlights).toHaveLength(2);
    });

    it('should replace existing highlights', () => {
      const state = {
        ...initialState,
        highlights: [createMockPdfHighlight({ id: 'old-1' })],
      };
      const newHighlights = [createMockPdfHighlight({ id: 'new-1' })];
      const action: DataAction = { type: 'SET_HIGHLIGHTS', payload: newHighlights };
      const newState = dataReducer(state, action);

      expect(newState.highlights).toEqual(newHighlights);
      expect(newState.highlights[0].id).toBe('new-1');
    });
  });

  describe('ADD_HIGHLIGHT', () => {
    it('should add highlight to empty array', () => {
      const highlight = createMockPdfHighlight();
      const action: DataAction = { type: 'ADD_HIGHLIGHT', payload: highlight };
      const newState = dataReducer(initialState, action);

      expect(newState.highlights).toHaveLength(1);
      expect(newState.highlights[0]).toEqual(highlight);
    });

    it('should add highlight to existing array', () => {
      const existing = createMockPdfHighlight({ id: 'existing-1', pageNumber: 5 });
      const state = { ...initialState, highlights: [existing] };
      const newHighlight = createMockPdfHighlight({ id: 'new-1', pageNumber: 10 });
      const action: DataAction = { type: 'ADD_HIGHLIGHT', payload: newHighlight };
      const newState = dataReducer(state, action);

      expect(newState.highlights).toHaveLength(2);
      expect(newState.highlights[1]).toEqual(newHighlight);
    });

    it('should sort highlights by page number', () => {
      const highlight1 = createMockPdfHighlight({ id: 'h1', pageNumber: 10 });
      const highlight2 = createMockPdfHighlight({ id: 'h2', pageNumber: 5 });
      const highlight3 = createMockPdfHighlight({ id: 'h3', pageNumber: 15 });

      let state = initialState;
      state = dataReducer(state, { type: 'ADD_HIGHLIGHT', payload: highlight1 });
      state = dataReducer(state, { type: 'ADD_HIGHLIGHT', payload: highlight2 });
      state = dataReducer(state, { type: 'ADD_HIGHLIGHT', payload: highlight3 });

      expect(state.highlights).toHaveLength(3);
      expect(state.highlights[0].id).toBe('h2'); // page 5
      expect(state.highlights[1].id).toBe('h1'); // page 10
      expect(state.highlights[2].id).toBe('h3'); // page 15
    });

    it('should sort by creation date when on same page', () => {
      const highlight1 = createMockPdfHighlight({
        id: 'h1',
        pageNumber: 5,
        createdAt: '2024-01-02T00:00:00.000Z',
      });
      const highlight2 = createMockPdfHighlight({
        id: 'h2',
        pageNumber: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      let state = initialState;
      state = dataReducer(state, { type: 'ADD_HIGHLIGHT', payload: highlight1 });
      state = dataReducer(state, { type: 'ADD_HIGHLIGHT', payload: highlight2 });

      expect(state.highlights[0].id).toBe('h2'); // Earlier date
      expect(state.highlights[1].id).toBe('h1'); // Later date
    });
  });

  describe('UPDATE_HIGHLIGHT', () => {
    it('should update existing highlight', () => {
      const existing = createMockPdfHighlight({ id: 'h1', note: 'Old note' });
      const state = { ...initialState, highlights: [existing] };
      const action: DataAction = {
        type: 'UPDATE_HIGHLIGHT',
        payload: { id: 'h1', data: { note: 'New note' } },
      };
      const newState = dataReducer(state, action);

      expect(newState.highlights[0].note).toBe('New note');
      expect(newState.highlights[0].id).toBe('h1');
    });

    it('should update color and hex', () => {
      const existing = createMockPdfHighlight({
        id: 'h1',
        color: 'yellow',
        hex: '#ffff00',
      });
      const state = { ...initialState, highlights: [existing] };
      const action: DataAction = {
        type: 'UPDATE_HIGHLIGHT',
        payload: { id: 'h1', data: { color: 'green', hex: '#00ff00' } },
      };
      const newState = dataReducer(state, action);

      expect(newState.highlights[0].color).toBe('green');
      expect(newState.highlights[0].hex).toBe('#00ff00');
    });

    it('should not affect other highlights', () => {
      const h1 = createMockPdfHighlight({ id: 'h1', note: 'Note 1' });
      const h2 = createMockPdfHighlight({ id: 'h2', note: 'Note 2' });
      const state = { ...initialState, highlights: [h1, h2] };
      const action: DataAction = {
        type: 'UPDATE_HIGHLIGHT',
        payload: { id: 'h1', data: { note: 'Updated note' } },
      };
      const newState = dataReducer(state, action);

      expect(newState.highlights[0].note).toBe('Updated note');
      expect(newState.highlights[1].note).toBe('Note 2');
    });

    it('should do nothing if highlight not found', () => {
      const existing = createMockPdfHighlight({ id: 'h1' });
      const state = { ...initialState, highlights: [existing] };
      const action: DataAction = {
        type: 'UPDATE_HIGHLIGHT',
        payload: { id: 'non-existent', data: { note: 'New note' } },
      };
      const newState = dataReducer(state, action);

      expect(newState.highlights).toEqual([existing]);
    });
  });

  describe('DELETE_HIGHLIGHT', () => {
    it('should delete highlight by id', () => {
      const h1 = createMockPdfHighlight({ id: 'h1' });
      const h2 = createMockPdfHighlight({ id: 'h2' });
      const state = { ...initialState, highlights: [h1, h2] };
      const action: DataAction = { type: 'DELETE_HIGHLIGHT', payload: 'h1' };
      const newState = dataReducer(state, action);

      expect(newState.highlights).toHaveLength(1);
      expect(newState.highlights[0].id).toBe('h2');
    });

    it('should handle deleting only highlight', () => {
      const highlight = createMockPdfHighlight({ id: 'h1' });
      const state = { ...initialState, highlights: [highlight] };
      const action: DataAction = { type: 'DELETE_HIGHLIGHT', payload: 'h1' };
      const newState = dataReducer(state, action);

      expect(newState.highlights).toEqual([]);
    });

    it('should do nothing if highlight not found', () => {
      const highlight = createMockPdfHighlight({ id: 'h1' });
      const state = { ...initialState, highlights: [highlight] };
      const action: DataAction = { type: 'DELETE_HIGHLIGHT', payload: 'non-existent' };
      const newState = dataReducer(state, action);

      expect(newState.highlights).toHaveLength(1);
      expect(newState.highlights[0].id).toBe('h1');
    });
  });

  describe('SET_LOADING_BOOKMARKS', () => {
    it('should set loading state to true', () => {
      const action: DataAction = { type: 'SET_LOADING_BOOKMARKS', payload: true };
      const newState = dataReducer(initialState, action);

      expect(newState.isLoadingBookmarks).toBe(true);
    });

    it('should set loading state to false', () => {
      const state = { ...initialState, isLoadingBookmarks: true };
      const action: DataAction = { type: 'SET_LOADING_BOOKMARKS', payload: false };
      const newState = dataReducer(state, action);

      expect(newState.isLoadingBookmarks).toBe(false);
    });
  });

  describe('SET_LOADING_HIGHLIGHTS', () => {
    it('should set loading state to true', () => {
      const action: DataAction = { type: 'SET_LOADING_HIGHLIGHTS', payload: true };
      const newState = dataReducer(initialState, action);

      expect(newState.isLoadingHighlights).toBe(true);
    });

    it('should set loading state to false', () => {
      const state = { ...initialState, isLoadingHighlights: true };
      const action: DataAction = { type: 'SET_LOADING_HIGHLIGHTS', payload: false };
      const newState = dataReducer(state, action);

      expect(newState.isLoadingHighlights).toBe(false);
    });
  });

  describe('SET_EDITING_BOOKMARK', () => {
    it('should set editing bookmark', () => {
      const bookmark = createMockBookmark();
      const action: DataAction = { type: 'SET_EDITING_BOOKMARK', payload: bookmark };
      const newState = dataReducer(initialState, action);

      expect(newState.editingBookmark).toEqual(bookmark);
    });

    it('should clear editing bookmark', () => {
      const state = { ...initialState, editingBookmark: createMockBookmark() };
      const action: DataAction = { type: 'SET_EDITING_BOOKMARK', payload: null };
      const newState = dataReducer(state, action);

      expect(newState.editingBookmark).toBeNull();
    });
  });

  describe('Immutability', () => {
    it('should not mutate original state when adding highlight', () => {
      const highlight = createMockPdfHighlight();
      const action: DataAction = { type: 'ADD_HIGHLIGHT', payload: highlight };
      const newState = dataReducer(initialState, action);

      expect(initialState.highlights).toEqual([]);
      expect(newState.highlights).toHaveLength(1);
    });

    it('should not mutate original highlights array', () => {
      const h1 = createMockPdfHighlight({ id: 'h1' });
      const state = { ...initialState, highlights: [h1] };
      const originalHighlights = state.highlights;
      
      const action: DataAction = { type: 'DELETE_HIGHLIGHT', payload: 'h1' };
      const newState = dataReducer(state, action);

      expect(originalHighlights).toHaveLength(1);
      expect(newState.highlights).toHaveLength(0);
      expect(newState.highlights).not.toBe(originalHighlights);
    });
  });
});

// ==================== Session Reducer Tests ====================

describe('sessionReducer', () => {
  const initialState: SessionState = {
    sessionStart: null,
    sessionStartPage: 1,
    isWindowActive: false,
  };

  describe('START_SESSION', () => {
    it('should start new session', () => {
      const beforeTime = new Date();
      const action: SessionAction = { type: 'START_SESSION', payload: { page: 5 } };
      const newState = sessionReducer(initialState, action);
      const afterTime = new Date();

      expect(newState.sessionStart).not.toBeNull();
      expect(newState.sessionStart!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(newState.sessionStart!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(newState.sessionStartPage).toBe(5);
      expect(newState.isWindowActive).toBe(true);
    });

    it('should set window active on session start', () => {
      const action: SessionAction = { type: 'START_SESSION', payload: { page: 1 } };
      const newState = sessionReducer(initialState, action);

      expect(newState.isWindowActive).toBe(true);
    });
  });

  describe('SET_WINDOW_ACTIVE', () => {
    it('should set window active to true', () => {
      const action: SessionAction = { type: 'SET_WINDOW_ACTIVE', payload: true };
      const newState = sessionReducer(initialState, action);

      expect(newState.isWindowActive).toBe(true);
    });

    it('should set window active to false', () => {
      const state = { ...initialState, isWindowActive: true };
      const action: SessionAction = { type: 'SET_WINDOW_ACTIVE', payload: false };
      const newState = sessionReducer(state, action);

      expect(newState.isWindowActive).toBe(false);
    });
  });

  describe('RESET_SESSION', () => {
    it('should reset session with new page', () => {
      const oldState = {
        sessionStart: new Date('2024-01-01'),
        sessionStartPage: 10,
        isWindowActive: true,
      };

      const beforeTime = new Date();
      const action: SessionAction = { type: 'RESET_SESSION', payload: { page: 25 } };
      const newState = sessionReducer(oldState, action);
      const afterTime = new Date();

      expect(newState.sessionStart!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(newState.sessionStart!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(newState.sessionStartPage).toBe(25);
    });

    it('should preserve window active state', () => {
      const state = { ...initialState, isWindowActive: true };
      const action: SessionAction = { type: 'RESET_SESSION', payload: { page: 1 } };
      const newState = sessionReducer(state, action);

      expect(newState.isWindowActive).toBe(true);
    });

    it('should preserve window inactive state', () => {
      const state = { ...initialState, isWindowActive: false };
      const action: SessionAction = { type: 'RESET_SESSION', payload: { page: 1 } };
      const newState = sessionReducer(state, action);

      expect(newState.isWindowActive).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should not mutate original state', () => {
      const action: SessionAction = { type: 'START_SESSION', payload: { page: 10 } };
      const newState = sessionReducer(initialState, action);

      expect(initialState.sessionStart).toBeNull();
      expect(initialState.sessionStartPage).toBe(1);
      expect(newState).not.toBe(initialState);
    });
  });
});
