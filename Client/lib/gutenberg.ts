import axios from 'axios';

const GUTENDEX_API_URL = 'https://gutendex.com/books';

export interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string; birth_year: number | null; death_year: number | null }[];
  translators: { name: string; birth_year: number | null; death_year: number | null }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: { [key: string]: string };
  download_count: number;
}

export interface GutenbergResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutenbergBook[];
}

export const gutenbergService = {
  /**
   * Search for books on Gutendex
   */
  async searchBooks(query: string = '', page: number = 1): Promise<GutenbergResponse> {
    try {
      const params: Record<string, string | number> = { page };
      if (query) {
        params.search = query;
      }
      
      const response = await axios.get<GutenbergResponse>(GUTENDEX_API_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching from Gutendex:', error);
      throw error;
    }
  },

  /**
   * Get popular books (default view)
   */
  async getPopularBooks(page: number = 1): Promise<GutenbergResponse> {
    return this.searchBooks('', page);
  }
};
