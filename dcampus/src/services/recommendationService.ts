import AIService, { AIResponse, AIServiceConfig } from './aiService';

/**
 * Course recommendation request parameters
 */
export interface CourseRecommendationRequest {
  studentId: string;
  count?: number;
  includeReasons?: boolean;
  filters?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string[];
    scheduleCompatible?: boolean;
    prerequisites?: boolean;
  };
}

/**
 * Course recommendation response
 */
export interface CourseRecommendation {
  courseId: string;
  courseName: string;
  courseCode: string;
  description: string;
  creditHours: number;
  department: string;
  instructor?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rating?: number;
  matchScore: number; // 0-1 indicating how well the course matches the student's profile
  reasons?: {
    reason: string;
    strength: number; // 0-1 indicating the strength of this reason
  }[];
  prerequisites?: string[];
}

/**
 * Learning resource recommendation request parameters
 */
export interface ResourceRecommendationRequest {
  studentId: string;
  courseId?: string;
  topicId?: string;
  count?: number;
  includeReasons?: boolean;
  resourceTypes?: ('video' | 'article' | 'exercise' | 'book' | 'tool')[];
}

/**
 * Learning resource recommendation response
 */
export interface ResourceRecommendation {
  resourceId: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'exercise' | 'book' | 'tool';
  url: string;
  creator?: string;
  duration?: number; // minutes for videos, reading time for articles
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  matchScore: number; // 0-1 indicating how well the resource matches the student's needs
  reasons?: {
    reason: string;
    strength: number; // 0-1 indicating the strength of this reason
  }[];
}

/**
 * Career path recommendation request parameters
 */
export interface CareerPathRecommendationRequest {
  studentId: string;
  count?: number;
  includeDetails?: boolean;
  includeSkillGaps?: boolean;
}

/**
 * Career path recommendation response
 */
export interface CareerPathRecommendation {
  careerPath: string;
  description: string;
  matchScore: number; // 0-1 indicating how well the career matches the student's profile
  relevantSkills: {
    skill: string;
    studentProficiency: number; // 0-1
    requiredProficiency: number; // 0-1
    gap?: number; // Difference between required and current proficiency
  }[];
  relevantCourses?: string[];
  industryDemand: 'low' | 'moderate' | 'high' | 'very high';
  averageSalary?: {
    entry: number;
    mid: number;
    senior: number;
    currency: string;
  };
  recommendedNextSteps?: {
    step: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }[];
}

/**
 * Class for handling personalized recommendations
 */
class RecommendationService extends AIService {
  constructor(config?: AIServiceConfig) {
    super(config);
  }

  /**
   * Get course recommendations for a specific student
   */
  public async getRecommendedCourses(
    request: CourseRecommendationRequest
  ): Promise<AIResponse<CourseRecommendation[]>> {
    try {
      const result = await this.makeRequest<AIResponse<CourseRecommendation[]>>(
        '/recommend/courses',
        'POST',
        request
      );
      return result;
    } catch (error) {
      console.error('Error getting course recommendations:', error);
      return {
        success: false,
        error: {
          code: 'recommendation_failed',
          message: 'Failed to get course recommendations',
          details: error
        }
      };
    }
  }

  /**
   * Get learning resource recommendations for a student
   */
  public async getRecommendedResources(
    request: ResourceRecommendationRequest
  ): Promise<AIResponse<ResourceRecommendation[]>> {
    try {
      const result = await this.makeRequest<AIResponse<ResourceRecommendation[]>>(
        '/recommend/resources',
        'POST',
        request
      );
      return result;
    } catch (error) {
      console.error('Error getting resource recommendations:', error);
      return {
        success: false,
        error: {
          code: 'recommendation_failed',
          message: 'Failed to get resource recommendations',
          details: error
        }
      };
    }
  }

  /**
   * Get career path recommendations for a student
   */
  public async getCareerPathRecommendations(
    request: CareerPathRecommendationRequest
  ): Promise<AIResponse<CareerPathRecommendation[]>> {
    try {
      const result = await this.makeRequest<AIResponse<CareerPathRecommendation[]>>(
        '/recommend/careers',
        'POST',
        request
      );
      return result;
    } catch (error) {
      console.error('Error getting career recommendations:', error);
      return {
        success: false,
        error: {
          code: 'recommendation_failed',
          message: 'Failed to get career recommendations',
          details: error
        }
      };
    }
  }

  /**
   * Mock course recommendation data for development purposes
   */
  public async getMockCourseRecommendations(studentId: string): Promise<AIResponse<CourseRecommendation[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      success: true,
      data: [
        {
          courseId: 'CS401',
          courseName: 'Advanced Data Structures',
          courseCode: 'CS 401',
          description: 'A comprehensive study of advanced data structures, algorithms, and their applications in solving complex programming problems.',
          creditHours: 3,
          department: 'Computer Science',
          instructor: 'Dr. Sarah Johnson',
          difficulty: 'medium',
          rating: 4.7,
          matchScore: 0.95,
          reasons: [
            {
              reason: 'Builds on your strong performance in Algorithms',
              strength: 0.9
            },
            {
              reason: 'Aligns with your interest in software development',
              strength: 0.85
            }
          ],
          prerequisites: ['CS201', 'CS302']
        },
        {
          courseId: 'CS445',
          courseName: 'Machine Learning Fundamentals',
          courseCode: 'CS 445',
          description: 'Introduction to the principles and techniques of machine learning with applications to real-world problems.',
          creditHours: 4,
          department: 'Computer Science',
          instructor: 'Dr. Michael Chen',
          difficulty: 'hard',
          rating: 4.5,
          matchScore: 0.87,
          reasons: [
            {
              reason: 'Complements your statistics background',
              strength: 0.8
            },
            {
              reason: 'Aligns with your career interest in AI',
              strength: 0.95
            }
          ],
          prerequisites: ['CS302', 'MATH240']
        },
        {
          courseId: 'CS380',
          courseName: 'Web Application Development',
          courseCode: 'CS 380',
          description: 'Comprehensive overview of web development principles, frameworks, and best practices for building modern web applications.',
          creditHours: 3,
          department: 'Computer Science',
          instructor: 'Prof. Elena Rodriguez',
          difficulty: 'medium',
          rating: 4.8,
          matchScore: 0.82,
          reasons: [
            {
              reason: 'Matches your project portfolio interests',
              strength: 0.85
            },
            {
              reason: 'Highly rated by students with similar profiles',
              strength: 0.75
            }
          ],
          prerequisites: ['CS215']
        }
      ],
      meta: {
        processingTime: 245,
        modelVersion: '2.1.0',
        requestId: `mock-${Date.now()}`
      }
    };
  }
  
  /**
   * Mock resource recommendation data for development purposes
   */
  public async getMockResourceRecommendations(studentId: string, courseId?: string): Promise<AIResponse<ResourceRecommendation[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: [
        {
          resourceId: 'vid-12345',
          title: 'Understanding BigO Notation',
          description: 'A comprehensive tutorial on algorithm complexity and BigO notation with visual examples.',
          type: 'video',
          url: 'https://example.com/videos/understanding-bigo',
          creator: 'Tech Learning Hub',
          duration: 28,
          difficulty: 'intermediate',
          topics: ['algorithms', 'complexity analysis', 'computer science fundamentals'],
          matchScore: 0.93,
          reasons: [
            {
              reason: 'Addresses concepts you\'re currently studying',
              strength: 0.9
            },
            {
              reason: 'Visual learning style match',
              strength: 0.85
            }
          ]
        },
        {
          resourceId: 'art-34567',
          title: 'Practical Applications of Binary Trees',
          description: 'Explore how binary trees are used in real-world applications with code examples in Python.',
          type: 'article',
          url: 'https://example.com/articles/binary-trees-applications',
          creator: 'CodeCraft Blog',
          duration: 15,
          difficulty: 'intermediate',
          topics: ['data structures', 'binary trees', 'python'],
          matchScore: 0.88,
          reasons: [
            {
              reason: 'Relevant to your current coursework',
              strength: 0.9
            },
            {
              reason: 'Practical application focus matches your learning preferences',
              strength: 0.8
            }
          ]
        },
        {
          resourceId: 'exc-56789',
          title: 'Advanced Sorting Algorithms Practice',
          description: 'Interactive exercises to practice implementing and analyzing different sorting algorithms.',
          type: 'exercise',
          url: 'https://example.com/exercises/sorting-algorithms',
          creator: 'Algorithm Academy',
          difficulty: 'advanced',
          topics: ['algorithms', 'sorting', 'performance optimization'],
          matchScore: 0.85,
          reasons: [
            {
              reason: 'Helps reinforce concepts from Algorithm Analysis course',
              strength: 0.9
            },
            {
              reason: 'Interactive practice matches your learning style',
              strength: 0.8
            }
          ]
        }
      ],
      meta: {
        processingTime: 187,
        modelVersion: '1.8.5',
        requestId: `mock-${Date.now()}`
      }
    };
  }
}

export default RecommendationService;