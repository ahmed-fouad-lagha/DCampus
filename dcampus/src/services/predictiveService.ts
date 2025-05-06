import AIService, { AIServiceConfig, AIResponse, AIServiceError, AIErrorType } from './aiService';

/**
 * Types for predictive analytics
 */
export interface PerformancePrediction {
  studentId: string;
  courseId: string;
  predictedGrade: number; // e.g. 0-100 scale
  confidenceScore: number; // 0-1 scale
  riskLevel: 'low' | 'medium' | 'high';
  contributingFactors: {
    factor: string;
    weight: number; // 0-1 scale
  }[];
  recommendations: string[];
  timestamp: string;
}

export interface PredictionParameters {
  studentId: string;
  courseId?: string;
  historicalData?: boolean;
  includeRecommendations?: boolean;
}

export interface PerformanceTrend {
  studentId: string;
  courseId?: string;
  timePoints: string[]; // dates or time periods
  predictedValues: number[];
  actualValues?: number[];
  confidenceIntervals?: {
    lower: number[];
    upper: number[];
  };
}

export interface EnrollmentPrediction {
  courseId: string;
  academicYear: string;
  semester: string;
  predictedEnrollment: number;
  changeFromPrevious: number; // percentage change
  factors: {
    factor: string;
    impact: number; // -1 to 1 scale
  }[];
}

/**
 * Service for predictive analytics related to academic performance
 */
class PredictiveService extends AIService {
  private useMockData: boolean;

  constructor(config: AIServiceConfig = {}) {
    super({
      ...config,
      baseURL: config.baseURL || process.env.REACT_APP_PREDICTIVE_API_URL
    });
    
    // Enable mock data in development environment or if specified
    this.useMockData = 
      config.baseURL === 'mock' || 
      process.env.NODE_ENV === 'development' || 
      process.env.REACT_APP_USE_MOCK_AI === 'true';
  }

  /**
   * Predict a student's performance in a specific course or overall
   */
  async predictStudentPerformance(params: PredictionParameters): Promise<PerformancePrediction> {
    if (this.useMockData) {
      return this.getMockPerformancePrediction(params);
    }
    
    try {
      const response = await this.makeRequest<AIResponse<PerformancePrediction>>(
        '/predict/performance', 
        'POST', 
        params
      );
      
      if (!response.success || !response.data) {
        throw new AIServiceError(
          response.error?.message || 'Failed to predict student performance',
          AIErrorType.UNKNOWN
        );
      }
      
      return response.data;
    } catch (error) {
      // If the error is a connection issue, fall back to mock data
      if (error instanceof AIServiceError && error.type === AIErrorType.NETWORK) {
        console.warn('Network error connecting to AI service. Using mock performance prediction data');
        return this.getMockPerformancePrediction(params);
      }
      
      throw error;
    }
  }

  /**
   * Predict performance trends over time
   */
  async predictPerformanceTrend(
    studentId: string,
    courseId?: string, 
    timeframe: 'semester' | 'year' | 'program' = 'semester'
  ): Promise<PerformanceTrend> {
    if (this.useMockData) {
      return this.getMockPerformanceTrend(studentId, courseId, timeframe);
    }
    
    try {
      const response = await this.makeRequest<AIResponse<PerformanceTrend>>(
        '/predict/trend',
        'POST',
        { studentId, courseId, timeframe }
      );
      
      if (!response.success || !response.data) {
        throw new AIServiceError(
          response.error?.message || 'Failed to predict performance trend',
          AIErrorType.UNKNOWN
        );
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AIServiceError && error.type === AIErrorType.NETWORK) {
        console.warn('Network error connecting to AI service. Using mock performance trend data');
        return this.getMockPerformanceTrend(studentId, courseId, timeframe);
      }
      
      throw error;
    }
  }

  /**
   * Predict course enrollment for upcoming periods
   */
  async predictCourseEnrollment(
    courseId: string,
    academicYear: string,
    semester: string
  ): Promise<EnrollmentPrediction> {
    if (this.useMockData) {
      return this.getMockEnrollmentPrediction(courseId, academicYear, semester);
    }
    
    try {
      const response = await this.makeRequest<AIResponse<EnrollmentPrediction>>(
        '/predict/enrollment',
        'POST',
        { courseId, academicYear, semester }
      );
      
      if (!response.success || !response.data) {
        throw new AIServiceError(
          response.error?.message || 'Failed to predict course enrollment',
          AIErrorType.UNKNOWN
        );
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AIServiceError && error.type === AIErrorType.NETWORK) {
        console.warn('Network error connecting to AI service. Using mock enrollment prediction data');
        return this.getMockEnrollmentPrediction(courseId, academicYear, semester);
      }
      
      throw error;
    }
  }

  /**
   * Identify students at risk in a specific course
   */
  async identifyAtRiskStudents(courseId: string): Promise<PerformancePrediction[]> {
    if (this.useMockData) {
      return this.getMockAtRiskStudents(courseId);
    }
    
    try {
      const response = await this.makeRequest<AIResponse<PerformancePrediction[]>>(
        '/predict/at-risk',
        'POST',
        { courseId }
      );
      
      if (!response.success || !response.data) {
        throw new AIServiceError(
          response.error?.message || 'Failed to identify at-risk students',
          AIErrorType.UNKNOWN
        );
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AIServiceError && error.type === AIErrorType.NETWORK) {
        console.warn('Network error connecting to AI service. Using mock at-risk student data');
        return this.getMockAtRiskStudents(courseId);
      }
      
      throw error;
    }
  }

  /**
   * Get students from a course and calculate their likelihood of dropping out
   */
  async predictDropoutRisk(
    courseId: string,
    threshold: number = 0.7
  ): Promise<Array<{studentId: string, riskScore: number, factors: string[]}>> {
    if (this.useMockData) {
      return this.getMockDropoutRiskData(courseId);
    }
    
    try {
      const response = await this.makeRequest<AIResponse<Array<{studentId: string, riskScore: number, factors: string[]}>>>(
        '/predict/dropout-risk',
        'POST',
        { courseId, threshold }
      );
      
      if (!response.success || !response.data) {
        throw new AIServiceError(
          response.error?.message || 'Failed to predict dropout risk',
          AIErrorType.UNKNOWN
        );
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof AIServiceError && error.type === AIErrorType.NETWORK) {
        console.warn('Network error connecting to AI service. Using mock dropout risk data');
        return this.getMockDropoutRiskData(courseId);
      }
      
      throw error;
    }
  }

  // MOCK DATA METHODS
  // These methods provide fallback data for development and testing

  private getMockPerformancePrediction(params: PredictionParameters): PerformancePrediction {
    const isRisky = params.studentId.includes('3') || params.studentId.includes('7');
    const isMediumRisk = params.studentId.includes('2') || params.studentId.includes('6');
    
    let riskLevel: 'low' | 'medium' | 'high';
    let predictedGrade: number;
    
    if (isRisky) {
      riskLevel = 'high';
      predictedGrade = 45 + Math.random() * 15; // 45-60 range
    } else if (isMediumRisk) {
      riskLevel = 'medium';
      predictedGrade = 60 + Math.random() * 15; // 60-75 range
    } else {
      riskLevel = 'low';
      predictedGrade = 75 + Math.random() * 20; // 75-95 range
    }
    
    return {
      studentId: params.studentId,
      courseId: params.courseId || 'OVERALL',
      predictedGrade: Math.round(predictedGrade),
      confidenceScore: 0.7 + Math.random() * 0.2, // 0.7-0.9 range
      riskLevel,
      contributingFactors: [
        { factor: 'Attendance', weight: 0.3 + Math.random() * 0.4 },
        { factor: 'Assignment Completion', weight: 0.2 + Math.random() * 0.5 },
        { factor: 'Previous Course Performance', weight: 0.4 + Math.random() * 0.3 },
        { factor: 'Learning Resource Utilization', weight: 0.3 + Math.random() * 0.4 }
      ],
      recommendations: [
        'Increase participation in class discussions',
        'Submit assignments on time',
        'Attend office hours for extra help',
        'Form study groups with classmates'
      ],
      timestamp: new Date().toISOString()
    };
  }

  private getMockAtRiskStudents(courseId: string): PerformancePrediction[] {
    return [
      this.getMockPerformancePrediction({ 
        studentId: 'S1003', 
        courseId,
        includeRecommendations: true
      }),
      this.getMockPerformancePrediction({ 
        studentId: 'S1007', 
        courseId,
        includeRecommendations: true
      }),
      this.getMockPerformancePrediction({ 
        studentId: 'S1002', 
        courseId,
        includeRecommendations: true
      })
    ].sort((a, b) => a.predictedGrade - b.predictedGrade);
  }

  private getMockPerformanceTrend(
    studentId: string,
    courseId?: string,
    timeframe: 'semester' | 'year' | 'program' = 'semester'
  ): PerformanceTrend {
    // Generate time points based on timeframe
    let timePoints: string[] = [];
    let count = timeframe === 'semester' ? 16 : timeframe === 'year' ? 8 : 4;
    
    for (let i = 1; i <= count; i++) {
      timePoints.push(timeframe === 'semester' ? `Week ${i}` : 
                      timeframe === 'year' ? `Month ${i}` : `Year ${i}`);
    }
    
    // Determine if this student has an upward or downward trend
    const isUpward = !studentId.includes('3') && !studentId.includes('7');
    
    // Generate mock predicted values with a realistic trend (generally improving or declining)
    const baseValue = 60 + Math.random() * 20;
    const predictedValues = timePoints.map((_, index) => {
      const progress = index / (count - 1); // 0 to 1
      const trend = isUpward ? (15 * progress) : (-15 * progress);
      const trendValue = baseValue + trend + (Math.random() * 10 - 5);
      return Math.min(100, Math.max(0, trendValue)); // Keep between 0-100
    });
    
    // For actual values, only provide some past data points
    const actualValues = predictedValues.map((val, index) => {
      return index < count / 2 ? val - 5 + Math.random() * 10 : undefined;
    }).filter(val => val !== undefined) as number[];
    
    return {
      studentId,
      courseId,
      timePoints,
      predictedValues,
      actualValues,
      confidenceIntervals: {
        lower: predictedValues.map(val => Math.max(0, val - 10 - Math.random() * 5)),
        upper: predictedValues.map(val => Math.min(100, val + 10 + Math.random() * 5))
      }
    };
  }

  private getMockEnrollmentPrediction(
    courseId: string, 
    academicYear: string, 
    semester: string
  ): EnrollmentPrediction {
    const baseEnrollment = 30 + Math.round(Math.random() * 70); // 30-100 students
    const previousEnrollment = baseEnrollment * (0.8 + Math.random() * 0.4); // 80%-120% of current
    const changePercent = ((baseEnrollment - previousEnrollment) / previousEnrollment) * 100;
    
    return {
      courseId,
      academicYear,
      semester,
      predictedEnrollment: baseEnrollment,
      changeFromPrevious: parseFloat(changePercent.toFixed(2)),
      factors: [
        { factor: 'Course Reputation', impact: 0.3 + Math.random() * 0.6 },
        { factor: 'Schedule Compatibility', impact: 0.2 + Math.random() * 0.5 },
        { factor: 'Prerequisite Completion Rate', impact: -0.1 - Math.random() * 0.3 },
        { factor: 'Competing Course Offerings', impact: -0.2 - Math.random() * 0.3 }
      ]
    };
  }

  private getMockDropoutRiskData(
    courseId: string
  ): Array<{studentId: string, riskScore: number, factors: string[]}> {
    // Generate between 5-10 at-risk students
    const count = 5 + Math.floor(Math.random() * 6);
    const result = [];
    
    for (let i = 0; i < count; i++) {
      const studentId = `S${1000 + i}`;
      const isHighRisk = i < 2; // First few students are high risk
      
      result.push({
        studentId,
        riskScore: isHighRisk 
          ? 0.7 + Math.random() * 0.25 // 0.7-0.95
          : 0.5 + Math.random() * 0.19, // 0.5-0.69
        factors: [
          'Attendance issues',
          'Low engagement with course materials',
          'Missed assignment deadlines',
          'Poor performance on assessments'
        ].slice(0, 2 + Math.floor(Math.random() * 3)) // Take 2-4 factors
      });
    }
    
    // Sort by risk score descending
    return result.sort((a, b) => b.riskScore - a.riskScore);
  }
}

export default PredictiveService;