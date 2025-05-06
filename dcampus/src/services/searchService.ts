import { SearchOptions, SearchResponse, SearchResult } from '../types/search.types';

// Mock data - in a real app, this would be replaced with API calls
const mockData: SearchResult[] = [
  { 
    id: 'course-1', 
    title: 'Introduction to Computer Science', 
    category: 'course',
    description: 'CS101 - Basic programming concepts',
    path: '/courses/cs101',
    date: '2025-01-15'
  },
  { 
    id: 'course-2', 
    title: 'Advanced Algorithms', 
    category: 'course',
    description: 'CS301 - Complex algorithm design',
    path: '/courses/cs301',
    date: '2025-02-20'
  },
  { 
    id: 'course-3', 
    title: 'Data Structures', 
    category: 'course',
    description: 'CS201 - Essential data structures',
    path: '/courses/cs201',
    date: '2025-03-10'
  },
  { 
    id: 'event-1', 
    title: 'Summer Hackathon', 
    category: 'event',
    description: 'June 15-16, 2025',
    path: '/events/hackathon-2025',
    date: '2025-06-15'
  },
  { 
    id: 'event-2', 
    title: 'Career Fair', 
    category: 'event',
    description: 'Meet with potential employers',
    path: '/events/career-fair-2025',
    date: '2025-05-22'
  },
  { 
    id: 'announcement-1', 
    title: 'Campus Closed for Holiday', 
    category: 'announcement',
    description: 'May 20, 2025',
    path: '/announcements/holiday-closure',
    date: '2025-05-20'
  },
  { 
    id: 'announcement-2', 
    title: 'New Library Hours', 
    category: 'announcement',
    description: 'Extended hours during finals week',
    path: '/announcements/library-hours',
    date: '2025-06-01'
  },
  { 
    id: 'user-1', 
    title: 'Prof. Sarah Johnson', 
    category: 'user',
    description: 'Faculty - Computer Science',
    path: '/users/sjohnson'
  },
  { 
    id: 'user-2', 
    title: 'Dr. Michael Chen', 
    category: 'user',
    description: 'Faculty - Mathematics',
    path: '/users/mchen'
  }
];

/**
 * Performs fuzzy search and filtering on the provided query
 */
const fuzzySearch = (data: SearchResult[], query: string): SearchResult[] => {
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(term => term.length > 0);
  
  return data.filter(item => {
    // Create searchable text from item properties
    const searchableText = `${item.title.toLowerCase()} ${item.description?.toLowerCase() || ''}`;
    
    // Simple matching algorithm with term relevance
    const matchesAllTerms = terms.every(term => searchableText.includes(term));
    return matchesAllTerms;
  }).sort((a, b) => {
    // Sort by relevance (how closely the title matches the query)
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    const queryInTitleA = titleA.includes(lowerQuery) ? 0 : 1;
    const queryInTitleB = titleB.includes(lowerQuery) ? 0 : 1;
    
    // First sort by direct title match
    if (queryInTitleA !== queryInTitleB) {
      return queryInTitleA - queryInTitleB;
    }
    
    // Then sort by date if available (most recent first)
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    // Fallback to title alphabetical order
    return titleA.localeCompare(titleB);
  });
};

/**
 * Search function that performs local search but is structured 
 * to be easily replaced with an API call
 */
export const search = async (options: SearchOptions): Promise<SearchResponse> => {
  try {
    // In a real app, this would be an API call like:
    // const response = await fetch('/api/search', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(options)
    // });
    // return await response.json();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Filter by query
    let results = fuzzySearch(mockData, options.query);
    
    // Filter by categories if provided
    if (options.categories && options.categories.length > 0) {
      results = results.filter(item => options.categories!.includes(item.category));
    }
    
    // Calculate total before pagination
    const totalCount = results.length;
    
    // Apply pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || 10;
      results = results.slice(offset, offset + limit);
    }
    
    return {
      results,
      totalCount
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      results: [],
      totalCount: 0
    };
  }
};

// For development/testing - can be removed in production
export const _mockData = mockData;