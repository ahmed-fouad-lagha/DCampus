export interface SearchResult {
  id: string;
  title: string;
  category: 'course' | 'event' | 'announcement' | 'user';
  description?: string;
  path: string;
  imageUrl?: string;
  date?: string;
}

export interface SearchOptions {
  query: string;
  categories?: Array<'course' | 'event' | 'announcement' | 'user'>;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}