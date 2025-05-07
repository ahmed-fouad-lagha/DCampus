import AIService, { AIResponse, AIServiceConfig } from './aiService';

/**
 * Student performance prediction input parameters
 */
export interface PerformancePredictionInput {
  studentId: string;
  courseId?: string;
  includeRiskFactors?: boolean;
  historicalData?: boolean;
}

/**
 * Student performance prediction result
 */
export interface PerformancePredictionResult {
  predictedGrade: number;
  confidenceScore: number;
  predictedPerformanceTrend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors?: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendedActions?: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

/**
 * Dropout prediction input parameters
 */
export interface DropoutPredictionInput {
  studentId: string;
  semesterId?: string;
  includeRiskFactors?: boolean;
  includeInterventions?: boolean;
}

/**
 * Dropout prediction result
 */
export interface DropoutPredictionResult {
  dropoutRisk: number; // 0-1 probability
  confidenceScore: number;
  timeHorizon: string; // e.g., "next semester", "within 1 year"
  riskFactors?: {
    factor: string;
    impact: number;
    description: string;
  }[];
  suggestedInterventions?: {
    intervention: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimatedImpact: number; // 0-1 reduction in risk
  }[];
}

/**
 * Enrollment prediction input parameters
 */
export interface EnrollmentPredictionInput {
  courseIds?: string[];
  semesterId: string;
  programId?: string;
  factors?: {
    previousEnrollment?: boolean;
    studentInterest?: boolean;
    courseAvailability?: boolean;
    graduationRequirements?: boolean;
  };
}

/**
 * Enrollment prediction result
 */
export interface EnrollmentPredictionResult {
  predictions: {
    courseId: string;
    courseName: string;
    predictedEnrollment: number;
    confidenceScore: number;
    changeFromLastSemester?: number;
    factors: {
      factor: string;
      impact: number;
    }[];
  }[];
  totalPredictedEnrollment: number;
  enrollmentTrend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Class for handling student performance predictions and analytics
 */
class PredictiveService extends AIService {
  constructor(config?: AIServiceConfig) {
    super(config);
  }

  /**
   * Predict student performance in a specific course or overall
   */
  public async predictStudentPerformance(
    input: PerformancePredictionInput
  ): Promise<AIResponse<PerformancePredictionResult>> {
    try {
      const result = await this.makeRequest<AIResponse<PerformancePredictionResult>>(
        '/predict/performance',
        'POST',
        input
      );
      return result;
    } catch (error) {
      console.error('Error predicting student performance:', error);
      return {
        success: false,
        error: {
          code: 'prediction_failed',
          message: 'Failed to predict student performance',
          details: error
        }
      };
    }
  }

  /**
   * Predict student dropout risk
   */
  public async predictDropoutRisk(
    input: DropoutPredictionInput
  ): Promise<AIResponse<DropoutPredictionResult>> {
    try {
      const result = await this.makeRequest<AIResponse<DropoutPredictionResult>>(
        '/predict/dropout',
        'POST',
        input
      );
      return result;
    } catch (error) {
      console.error('Error predicting dropout risk:', error);
      return {
        success: false,
        error: {
          code: 'prediction_failed',
          message: 'Failed to predict dropout risk',
          details: error
        }
      };
    }
  }

  /**
   * Predict enrollment for courses in a specific semester
   */
  public async predictEnrollment(
    input: EnrollmentPredictionInput
  ): Promise<AIResponse<EnrollmentPredictionResult>> {
    try {
      const result = await this.makeRequest<AIResponse<EnrollmentPredictionResult>>(
        '/predict/enrollment',
        'POST',
        input
      );
      return result;
    } catch (error) {
      console.error('Error predicting enrollment:', error);
      return {
        success: false,
        error: {
          code: 'prediction_failed',
          message: 'Failed to predict enrollment',
          details: error
        }
      };
    }
  }

  /**
   * Mock data for development purposes
   */
  public async getMockPerformanceData(studentId: string): Promise<AIResponse<PerformancePredictionResult>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: {
        predictedGrade: 85.5,
        confidenceScore: 0.87,
        predictedPerformanceTrend: 'improving',
        riskLevel: 'low',
        riskFactors: [
          {
            factor: 'Assignment completion rate',
            impact: 0.6,
            description: 'Student has completed 85% of assignments on time'
          },
          {
            factor: 'Attendance',
            impact: 0.3,
            description: 'Attendance has improved in the last 3 weeks'
          }
        ],
        recommendedActions: [
          {
            action: 'Complete practice exercises',
            priority: 'medium',
            description: 'Additional practice on recent topics could improve performance'
          },
          {
            action: 'Attend office hours',
            priority: 'low',
            description: 'Discuss concepts from Week 6 to strengthen understanding'
          }
        ]
      },
      meta: {
        processingTime: 234,
        modelVersion: '1.2.0',
        requestId: `mock-${Date.now()}`
      }
    };
  }
  
  /**
   * Mock data for dropout risk
   */
  public async getMockDropoutRiskData(studentId: string): Promise<AIResponse<DropoutPredictionResult>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      data: {
        dropoutRisk: 0.15,
        confidenceScore: 0.92,
        timeHorizon: "next semester",
        riskFactors: [
          {
            factor: "Course load",
            impact: 0.4,
            description: "Current course load is significantly higher than previous semester"
          },
          {
            factor: "Financial aid status",
            impact: 0.3,
            description: "Changes in financial aid status may affect continued enrollment"
          }
        ],
        suggestedInterventions: [
          {
            intervention: "Academic advising session",
            priority: "medium",
            description: "Review current course load and discuss potential adjustments",
            estimatedImpact: 0.3
          },
          {
            intervention: "Financial aid counseling",
            priority: "high",
            description: "Explore additional financial aid options and payment plans",
            estimatedImpact: 0.5
          }
        ]
      },
      meta: {
        processingTime: 189,
        modelVersion: '1.3.1',
        requestId: `mock-${Date.now()}`
      }
    };
  }
}

export default PredictiveService;