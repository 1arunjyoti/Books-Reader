export type HighlightSource = 'EPUB' | 'PDF';

export interface PdfHighlightRect {
  /** Normalized X coordinate (0 - 1) relative to page width */
  x: number;
  /** Normalized Y coordinate (0 - 1) relative to page height */
  y: number;
  /** Normalized width (0 - 1) relative to page width */
  width: number;
  /** Normalized height (0 - 1) relative to page height */
  height: number;
  /** Optional page number for multi-page selections */
  pageNumber?: number;
}

interface BaseHighlight {
  id: string;
  text: string;
  color: string;
  hex: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  source: HighlightSource;
  pageNumber?: number;
}

export interface EpubHighlight extends BaseHighlight {
  source: 'EPUB';
  cfiRange: string;
}

export interface PdfHighlight extends BaseHighlight {
  source: 'PDF';
  pageNumber: number;
  rects: PdfHighlightRect[];
  boundingRect: PdfHighlightRect;
}

export type Highlight = EpubHighlight | PdfHighlight;
