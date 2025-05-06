import AIService, { AIServiceConfig } from './aiService';

/**
 * Types for recommendation system
 */
export interface CourseRecommendation {
  courseId: string;
  courseName: string;
  department: string;
  relevanceScore: number; // 0-1 scale
  reasonsForRecommendation: string[];
  expectedDifficulty: 'easy' | 'moderate' | 'challenging';
  prerequisites: string[];
  skillsGained: string[];
  careerRelevance?: string[];
}

export interface ResourceRecommendation {
  resourceId: string;
  resourceName: string;
  resourceType: 'book' | 'article' | 'video' | 'website' | 'tool' | 'practice';
  relevanceScore: number; // 0-1 scale
  description: string;
  url?: string;
  estimatedTimeToComplete?: string; // e.g. "2 hours", "3 days"
}

export interface PeerGroupRecommendation {
  groupId: string;
  topic: string;
  relevanceScore: number;
  studentIds: string[];
  suggestedActivities: string[];
  expectedOutcomes: string[];
}

export interface CareerPathRecommendation {
  pathId: string;
  careerTitle: string;
  relevanceScore: number;
  matchedSkills: string[];
  requiredSkills: string[];
  recommendedCourses: {
    courseId: string;
    courseName: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  industryDemand: 'high' | 'medium' | 'low';
  estimatedSalaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface RecommendationParameters {
  userId: string;
  userRole: 'student' | 'faculty' | 'admin';
  currentCourseId?: string;
  academicFocus?: string[];
  careerInterests?: string[];
  previouslyCompleted?: string[];
  limit?: number;
}

/**
 * Service for AI-powered recommendations
 */
class RecommendationService extends AIService {
  constructor(config: AIServiceConfig = {}) {
    super({
      ...config,
      baseURL: config.baseURL || process.env.REACT_APP_RECOMMENDATION_API_URL
    });
  }

  /**
   * Get course recommendations for a user
   */
  async getRecommendedCourses(params: RecommendationParameters): Promise<CourseRecommendation[]> {
    try {
      return await this.makeRequest<CourseRecommendation[]>('/recommend/courses', 'POST', params);
    } catch (error) {
      console.warn('Using mock course recommendations');
      return this.getMockCourseRecommendations(params);
    }
  }

  /**
   * Get resource recommendations for a user
   */
  async getRecommendedResources(
    params: RecommendationParameters & { resourceTypes?: string[] }
  ): Promise<ResourceRecommendation[]> {
    try {
      return await this.makeRequest<ResourceRecommendation[]>('/recommend/resources', 'POST', params);
    } catch (error) {
      console.warn('Using mock resource recommendations');
      return this.getMockResourceRecommendations(params);
    }
  }

  /**
   * Get peer group recommendations for collaborative learning
   */
  async getRecommendedPeerGroups(params: RecommendationParameters): Promise<PeerGroupRecommendation[]> {
    try {
      return await this.makeRequest<PeerGroupRecommendation[]>('/recommend/peer-groups', 'POST', params);
    } catch (error) {
      console.warn('Using mock peer group recommendations');
      return this.getMockPeerGroupRecommendations(params);
    }
  }

  /**
   * Get career path recommendations based on academic profile
   */
  async getRecommendedCareerPaths(params: RecommendationParameters): Promise<CareerPathRecommendation[]> {
    try {
      return await this.makeRequest<CareerPathRecommendation[]>('/recommend/career-paths', 'POST', params);
    } catch (error) {
      console.warn('Using mock career path recommendations');
      return this.getMockCareerPathRecommendations(params);
    }
  }

  // MOCK DATA METHODS
  // These methods provide fallback data for development and testing

  private getMockCourseRecommendations(params: RecommendationParameters): CourseRecommendation[] {
    const courses = [
      {
        courseId: 'CS301',
        courseName: 'Data Structures and Algorithms',
        department: 'Computer Science',
        relevanceScore: 0.95,
        reasonsForRecommendation: [
          'Based on your performance in CS101',
          'Essential for your computer science major',
          'Builds foundational programming skills'
        ],
        expectedDifficulty: 'moderate' as const,
        prerequisites: ['CS101', 'MATH142'],
        skillsGained: ['Algorithm design', 'Time complexity analysis', 'Data structure implementation']
      },
      {
        courseId: 'CS350',
        courseName: 'Database Systems',
        department: 'Computer Science',
        relevanceScore: 0.88,
        reasonsForRecommendation: [
          'Complements your web development interests',
          'Required for software engineering roles',
          'High career relevance in data management'
        ],
        expectedDifficulty: 'moderate' as const,
        prerequisites: ['CS201'],
        skillsGained: ['SQL', 'Database design', 'Query optimization']
      },
      {
        courseId: 'AI400',
        courseName: 'Introduction to Machine Learning',
        department: 'Artificial Intelligence',
        relevanceScore: 0.82,
        reasonsForRecommendation: [
          'Aligns with your interest in data science',
          'Growing field with high job demand',
          'Builds on your strong mathematics background'
        ],
        expectedDifficulty: 'challenging' as const,
        prerequisites: ['CS301', 'STATS201', 'MATH242'],
        skillsGained: ['Predictive modeling', 'Statistical analysis', 'Python for ML'],
        careerRelevance: ['Data Scientist', 'ML Engineer', 'AI Researcher']
      }
    ];
    
    // Adjust recommendations based on user role
    if (params.userRole === 'faculty') {
      return courses.map(course => ({
        ...course,
        reasonsForRecommendation: [
          'Popular among students in your department',
          'Complementary to courses you currently teach',
          'Potential for research collaboration'
        ]
      }));
    }
    
    return courses.slice(0, params.limit || courses.length);
  }

  private getMockResourceRecommendations(
    params: RecommendationParameters & { resourceTypes?: string[] }
  ): ResourceRecommendation[] {
    const resources = [
      {
        resourceId: 'RES001',
        resourceName: 'Introduction to Algorithm Design',
        resourceType: 'book' as const,
        relevanceScore: 0.92,
        description: 'A comprehensive guide to algorithm design techniques, with practical examples and exercises.',
        estimatedTimeToComplete: '30 hours'
      },
      {
        resourceId: 'RES002',
        resourceName: 'SQL Mastery Tutorial Series',
        resourceType: 'video' as const,
        relevanceScore: 0.88,
        description: 'Video series covering SQL from basics to advanced queries, indexing, and optimization.',
        url: 'https://example.com/sql-tutorials',
        estimatedTimeToComplete: '12 hours'
      },
      {
        resourceId: 'RES003',
        resourceName: 'Machine Learning Practice Projects',
        resourceType: 'practice' as const,
        relevanceScore: 0.79,
        description: 'Hands-on projects to apply machine learning concepts to real-world problems.',
        url: 'https://example.com/ml-projects',
        estimatedTimeToComplete: '40 hours'
      },
      {
        resourceId: 'RES004',
        resourceName: 'Research Methods in Computer Science',
        resourceType: 'article' as const,
        relevanceScore: 0.75,
        description: 'Academic paper discussing effective research methodologies in computer science.',
        url: 'https://example.com/research-methods',
        estimatedTimeToComplete: '3 hours'
      }
    ];
    
    // Filter by resource type if specified
    let filteredResources = resources;
    if (params.resourceTypes && params.resourceTypes.length > 0) {
      filteredResources = resources.filter(resource => 
        params.resourceTypes?.includes(resource.resourceType)
      );
    }
    
    return filteredResources.slice(0, params.limit || filteredResources.length);
  }

  private getMockPeerGroupRecommendations(params: RecommendationParameters): PeerGroupRecommendation[] {
    return [
      {
        groupId: 'PG001',
        topic: 'Algorithm Study Group',
        relevanceScore: 0.91,
        studentIds: ['S1005', 'S1032', 'S1047'],
        suggestedActivities: [
          'Weekly problem-solving sessions',
          'Collaborative coding challenges',
          'Algorithm competition preparation'
        ],
        expectedOutcomes: [
          'Improved problem-solving skills',
          'Better algorithm analysis capabilities',
          'Preparation for technical interviews'
        ]
      },
      {
        groupId: 'PG002',
        topic: 'Database Project Team',
        relevanceScore: 0.85,
        studentIds: ['S1012', 'S1025', 'S1041'],
        suggestedActivities: [
          'Database design workshops',
          'Real-world database implementation',
          'Performance optimization exercises'
        ],
        expectedOutcomes: [
          'Practical database implementation experience',
          'Team collaboration skills',
          'Project portfolio development'
        ]
      }
    ].slice(0, params.limit || 2);
  }

  private getMockCareerPathRecommendations(params: RecommendationParameters): CareerPathRecommendation[] {
    return [
      {
        pathId: 'CP001',
        careerTitle: 'Software Engineer',
        relevanceScore: 0.94,
        matchedSkills: ['Programming', 'Data Structures', 'Problem Solving'],
        requiredSkills: ['System Design', 'DevOps', 'Testing Methodologies'],
        recommendedCourses: [
          { courseId: 'CS401', courseName: 'Software Engineering', priority: 'high' as const },
          { courseId: 'CS430', courseName: 'System Architecture', priority: 'medium' as const },
          { courseId: 'CS450', courseName: 'DevOps and Deployment', priority: 'low' as const }
        ],
        industryDemand: 'high' as const,
        estimatedSalaryRange: {
          min: 60000,
          max: 120000,
          currency: 'USD'
        }
      },
      {
        pathId: 'CP002',
        careerTitle: 'Data Scientist',
        relevanceScore: 0.87,
        matchedSkills: ['Statistics', 'Programming', 'Analytical Thinking'],
        requiredSkills: ['Machine Learning', 'Big Data Technologies', 'Data Visualization'],
        recommendedCourses: [
          { courseId: 'AI400', courseName: 'Introduction to Machine Learning', priority: 'high' as const },
          { courseId: 'STATS302', courseName: 'Advanced Statistical Methods', priority: 'high' as const },
          { courseId: 'CS460', courseName: 'Big Data Processing', priority: 'medium' as const }
        ],
        industryDemand: 'high' as const,
        estimatedSalaryRange: {
          min: 70000,
          max: 130000,
          currency: 'USD'
        }
      },
      {
        pathId: 'CP003',
        careerTitle: 'Cloud Solutions Architect',
        relevanceScore: 0.81,
        matchedSkills: ['System Design', 'Network Knowledge', 'Problem Solving'],
        requiredSkills: ['Cloud Platforms', 'Security Protocols', 'Distributed Systems'],
        recommendedCourses: [
          { courseId: 'CS440', courseName: 'Cloud Computing', priority: 'high' as const },
          { courseId: 'CS455', courseName: 'Distributed Systems', priority: 'medium' as const },
          { courseId: 'CS435', courseName: 'Network Security', priority: 'medium' as const }
        ],
        industryDemand: 'high' as const,
        estimatedSalaryRange: {
          min: 80000,
          max: 150000,
          currency: 'USD'
        }
      }
    ].slice(0, params.limit || 3);
  }
}

export default RecommendationService;