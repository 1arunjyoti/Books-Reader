/**
 * PDF Reader State Management with useReducer
 * Consolidates 30+ useState hooks into logical, maintainable groups
 */

import { produce } from 'immer';
import type { PdfHighlight } from '@/types/highlights';
import type { Bookmark } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

// ==================== Viewer State ====================
export interface ViewerState {
  currentPage: number;
  numPages: number;
  pageInput: string;
  scale: number;
  rotation: number;
  pdfDoc: PDFDocumentProxy | null;
}

export type ViewerAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_NUM_PAGES'; payload: number }
  | { type: 'SET_PAGE_INPUT'; payload: string }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'ADJUST_SCALE'; payload: number } // For zoom in/out
  | { type: 'SET_ROTATION'; payload: number }
  | { type: 'ROTATE'; payload: number } // For rotation increment
  | { type: 'SET_PDF_DOC'; payload: PDFDocumentProxy | null }
  | { type: 'INITIALIZE_PAGE'; payload: { page: number; numPages: number } };

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'SET_CURRENT_PAGE':
        draft.currentPage = action.payload;
        draft.pageInput = String(action.payload);
        break;
      
      case 'SET_NUM_PAGES':
        draft.numPages = action.payload;
        break;
      
      case 'SET_PAGE_INPUT':
        draft.pageInput = action.payload;
        break;
      
      case 'SET_SCALE':
        draft.scale = action.payload;
        break;
      
      case 'ADJUST_SCALE':
        draft.scale = Math.min(3, Math.max(0.5, state.scale + action.payload));
        break;
      
      case 'SET_ROTATION':
        draft.rotation = action.payload;
        break;
      
      case 'ROTATE':
        draft.rotation = ((state.rotation + action.payload) % 360 + 360) % 360;
        break;
      
      case 'SET_PDF_DOC':
        draft.pdfDoc = action.payload;
        break;
      
      case 'INITIALIZE_PAGE':
        draft.currentPage = action.payload.page;
        draft.numPages = action.payload.numPages;
        draft.pageInput = String(action.payload.page);
        break;
    }
  });
}

// ==================== UI State ====================
export interface UIState {
  isFullscreen: boolean;
  enableTextSelection: boolean;
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  customBgColor: string;
  panels: {
    contentsAndBookmarks: boolean;
    bookmarkForm: boolean;
    thumbnails: boolean;
    search: boolean;
    tts: boolean;
    displayOptions: boolean;
    highlights: boolean;
  };
}

export type UIAction =
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'TOGGLE_TEXT_SELECTION' }
  | { type: 'SET_TEXT_SELECTION'; payload: boolean }
  | { type: 'SET_COLOR_FILTER'; payload: 'none' | 'sepia' | 'dark' | 'custom' }
  | { type: 'SET_CUSTOM_BG_COLOR'; payload: string }
  | { type: 'TOGGLE_PANEL'; payload: keyof UIState['panels'] }
  | { type: 'SET_PANEL'; payload: { panel: keyof UIState['panels']; open: boolean } }
  | { type: 'CLOSE_ALL_PANELS' };

export function uiReducer(state: UIState, action: UIAction): UIState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'TOGGLE_FULLSCREEN':
        draft.isFullscreen = !state.isFullscreen;
        break;
      
      case 'SET_FULLSCREEN':
        draft.isFullscreen = action.payload;
        break;
      
      case 'TOGGLE_TEXT_SELECTION':
        draft.enableTextSelection = !state.enableTextSelection;
        break;
      
      case 'SET_TEXT_SELECTION':
        draft.enableTextSelection = action.payload;
        break;
      
      case 'SET_COLOR_FILTER':
        draft.colorFilter = action.payload;
        break;
      
      case 'SET_CUSTOM_BG_COLOR':
        draft.customBgColor = action.payload;
        break;
      
      case 'TOGGLE_PANEL':
        draft.panels[action.payload] = !state.panels[action.payload];
        break;
      
      case 'SET_PANEL':
        draft.panels[action.payload.panel] = action.payload.open;
        break;
      
      case 'CLOSE_ALL_PANELS':
        // Direct mutation - Immer makes this safe
        Object.keys(draft.panels).forEach((key) => {
          draft.panels[key as keyof typeof draft.panels] = false;
        });
        break;
    }
  });
}

// ==================== Data State ====================

export interface DataState {
  bookmarks: Bookmark[];
  highlights: PdfHighlight[];
  isLoadingBookmarks: boolean;
  isLoadingHighlights: boolean;
  editingBookmark: Bookmark | null;
}

export type DataAction =
  | { type: 'SET_BOOKMARKS'; payload: Bookmark[] }
  | { type: 'SET_HIGHLIGHTS'; payload: PdfHighlight[] }
  | { type: 'ADD_HIGHLIGHT'; payload: PdfHighlight }
  | { type: 'UPDATE_HIGHLIGHT'; payload: { id: string; data: Partial<PdfHighlight> } }
  | { type: 'DELETE_HIGHLIGHT'; payload: string }
  | { type: 'SET_LOADING_BOOKMARKS'; payload: boolean }
  | { type: 'SET_LOADING_HIGHLIGHTS'; payload: boolean }
  | { type: 'SET_EDITING_BOOKMARK'; payload: Bookmark | null };

export function dataReducer(state: DataState, action: DataAction): DataState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'SET_BOOKMARKS':
        draft.bookmarks = action.payload;
        break;
      
      case 'SET_HIGHLIGHTS':
        draft.highlights = action.payload;
        break;
      
      case 'ADD_HIGHLIGHT':
        draft.highlights.push(action.payload);
        // Sort in place - Immer makes this safe
        draft.highlights.sort((a, b) => {
          const pageDiff = (a.pageNumber ?? 0) - (b.pageNumber ?? 0);
          if (pageDiff !== 0) return pageDiff;
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });
        break;
      
      case 'UPDATE_HIGHLIGHT': {
        const index = draft.highlights.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          // Direct mutation - Immer handles immutability
          Object.assign(draft.highlights[index], action.payload.data);
        }
        break;
      }
      
      case 'DELETE_HIGHLIGHT': {
        const index = draft.highlights.findIndex((h) => h.id === action.payload);
        if (index !== -1) {
          draft.highlights.splice(index, 1);
        }
        break;
      }
      
      case 'SET_LOADING_BOOKMARKS':
        draft.isLoadingBookmarks = action.payload;
        break;
      
      case 'SET_LOADING_HIGHLIGHTS':
        draft.isLoadingHighlights = action.payload;
        break;
      
      case 'SET_EDITING_BOOKMARK':
        draft.editingBookmark = action.payload;
        break;
    }
  });
}

// ==================== Session State ====================
export interface SessionState {
  sessionStart: Date | null;
  sessionStartPage: number;
  isWindowActive: boolean;
}

export type SessionAction =
  | { type: 'START_SESSION'; payload: { page: number } }
  | { type: 'SET_WINDOW_ACTIVE'; payload: boolean }
  | { type: 'RESET_SESSION'; payload: { page: number } };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'START_SESSION':
        draft.sessionStart = new Date();
        draft.sessionStartPage = action.payload.page;
        draft.isWindowActive = true;
        break;
      
      case 'SET_WINDOW_ACTIVE':
        draft.isWindowActive = action.payload;
        break;
      
      case 'RESET_SESSION':
        draft.sessionStart = new Date();
        draft.sessionStartPage = action.payload.page;
        // isWindowActive remains unchanged
        break;
    }
  });
}
