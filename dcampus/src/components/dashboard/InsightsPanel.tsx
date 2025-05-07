import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Alert,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  ArrowForward as ArrowIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ImproveIcon,
  ArrowDownward as DeclineIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Import AI services
import PredictiveService, { PerformancePredictionResult } from '../../services/predictiveService';
import RecommendationService, { CourseRecommendation as BaseRecommendation } from '../../services/recommendationService';

interface InsightsPanelProps {
  userId?: string;
  userRole?: 'student' | 'faculty' | 'admin';
  initialTab?: 'predictions' | 'recommendations';
  onInsightClick?: (insightId: string) => void;
}

// Extended CourseRecommendation interface with additional properties used in this component
interface CourseRecommendation extends BaseRecommendation {
  relevanceScore: number;
  expectedDifficulty: 'easy' | 'medium' | 'hard';
  reasonsForRecommendation: string[];
  skillsGained: string[];
}

// Create custom internal interfaces that match what we're using in the component
interface PerformancePrediction {
  studentId?: string;
  courseId?: string;
  predictedGrade: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  contributingFactors: { factor: string; weight: number }[];
  recommendations?: string[];
}

// Extended PredictiveService class with the missing method
class ExtendedPredictiveService extends PredictiveService {
  public async identifyAtRiskStudents(courseId: string): Promise<any> {
    // Mock implementation for now
    return {
      success: true,
      data: [
        {
          studentId: 'S1001',
          courseId: courseId,
          predictedGrade: 65,
          confidenceScore: 0.82,
          riskLevel: 'high',
          recommendations: [
            'Schedule one-on-one tutoring',
            'Review fundamental concepts from week 1-3'
          ]
        },
        {
          studentId: 'S1042',
          courseId: courseId,
          predictedGrade: 72,
          confidenceScore: 0.78,
          riskLevel: 'medium',
          recommendations: [
            'Provide additional practice materials',
            'Follow up on missing assignments'
          ]
        }
      ]
    };
  }
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  userId = '1', 
  userRole = 'student', 
  initialTab = 'predictions',
  onInsightClick
}) => {
  const [activeTab, setActiveTab] = useState<'predictions' | 'recommendations'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PerformancePrediction[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const theme = useTheme();
  const { t } = useTranslation();

  // Initialize AI services
  const predictiveService = new ExtendedPredictiveService();
  const recommendationService = new RecommendationService();

  // Fetch AI insights data
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // For development/testing, use mock data
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Use mock data instead of real API calls
        const mockPredictions: PerformancePrediction[] = [
          {
            courseId: 'CS101',
            predictedGrade: 87,
            confidenceScore: 0.85,
            riskLevel: 'low',
            contributingFactors: [
              { factor: 'Assignment completion rate', weight: 0.8 },
              { factor: 'Quiz performance', weight: 0.7 },
              { factor: 'Class participation', weight: 0.6 }
            ],
            recommendations: [
              'Review Chapter 5 material before the midterm',
              'Participate more actively in discussion forums'
            ]
          },
          {
            courseId: 'MATH202',
            predictedGrade: 72,
            confidenceScore: 0.78,
            riskLevel: 'medium',
            contributingFactors: [
              { factor: 'Recent quiz scores', weight: 0.3 },
              { factor: 'Assignment submission delays', weight: 0.4 },
              { factor: 'Time spent on practice problems', weight: 0.35 }
            ],
            recommendations: [
              'Schedule a tutoring session for calculus concepts',
              'Increase practice problem completion rate',
              'Attend office hours to clarify recent topics'
            ]
          }
        ];
        
        const mockRecommendations: CourseRecommendation[] = [
          {
            courseId: 'CS301',
            courseName: 'Database Systems',
            courseCode: 'CS 301',
            description: 'Introduction to database design and systems',
            creditHours: 3,
            department: 'Computer Science',
            difficulty: 'medium',
            expectedDifficulty: 'medium',
            matchScore: 0.92,
            relevanceScore: 0.92,
            reasonsForRecommendation: [
              'Builds on your strong performance in Data Structures',
              'Aligns with your interest in software development'
            ],
            skillsGained: ['SQL', 'Database Design', 'Data Modeling']
          },
          {
            courseId: 'CS445',
            courseName: 'Machine Learning',
            courseCode: 'CS 445',
            description: 'Introduction to machine learning algorithms and applications',
            creditHours: 4,
            department: 'Computer Science',
            difficulty: 'hard',
            expectedDifficulty: 'hard',
            matchScore: 0.87,
            relevanceScore: 0.87,
            reasonsForRecommendation: [
              'Complements your statistics background',
              'Aligns with your career interest in AI'
            ],
            skillsGained: ['Python', 'Data Analysis', 'Algorithm Design']
          }
        ];
        
        setPredictions(mockPredictions);
        setRecommendations(mockRecommendations);
        return;
      }
      
      // Real API calls for production
      // Fetch in parallel for better performance
      const [performanceResponse, recommendationsResponse] = await Promise.all([
        userRole === 'student' 
          ? predictiveService.predictStudentPerformance({ studentId: userId })
          : userRole === 'faculty'
            ? predictiveService.identifyAtRiskStudents('CURRENT_COURSE')
            : { success: false, error: { message: 'Unsupported user role' } },
        recommendationService.getRecommendedCourses({
          studentId: userId,
          count: 3,
          includeReasons: true
        })
      ]);

      // Handle performance predictions
      if (performanceResponse && performanceResponse.success && performanceResponse.data) {
        // Map the API response to our internal format
        const mappedPredictions: PerformancePrediction[] = Array.isArray(performanceResponse.data) 
          ? performanceResponse.data.map(mapPerformancePrediction)
          : [mapPerformancePrediction(performanceResponse.data)];
        
        setPredictions(mappedPredictions);
      } else if (performanceResponse && performanceResponse.error) {
        console.error('Error with performance predictions:', performanceResponse.error);
        setError(performanceResponse.error.message);
      }
      
      // Handle course recommendations
      if (recommendationsResponse && recommendationsResponse.success && recommendationsResponse.data) {
        // Map the API response to our extended interface
        const mappedRecommendations = recommendationsResponse.data.map((rec: BaseRecommendation) => ({
          ...rec,
          relevanceScore: rec.matchScore, // Use matchScore as relevanceScore
          expectedDifficulty: rec.difficulty, // Use difficulty as expectedDifficulty
          reasonsForRecommendation: rec.reasons?.map(r => r.reason) || [],
          skillsGained: rec.prerequisites || [] // Use prerequisites as skills for now
        }));
        
        setRecommendations(mappedRecommendations);
      } else if (recommendationsResponse && recommendationsResponse.error) {
        console.error('Error with recommendations:', recommendationsResponse.error);
        setError(recommendationsResponse.error.message);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to load AI insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map API response to our component format
  const mapPerformancePrediction = (apiData: PerformancePredictionResult): PerformancePrediction => {
    return {
      // Fix: Remove the reference to courseId property that doesn't exist in PerformancePredictionResult
      courseId: 'OVERALL',
      predictedGrade: apiData.predictedGrade,
      confidenceScore: apiData.confidenceScore,
      riskLevel: apiData.riskLevel,
      contributingFactors: apiData.riskFactors?.map(factor => ({
        factor: factor.factor,
        weight: factor.impact
      })) || [],
      recommendations: apiData.recommendedActions?.map(action => action.action)
    };
  };

  // Load insights when component mounts
  useEffect(() => {
    fetchInsights();
  }, [userId, userRole, fetchInsights]);

  // Render risk level indicator
  const renderRiskLevel = (level: 'low' | 'medium' | 'high') => {
    const color = level === 'low' 
      ? theme.palette.success.main 
      : level === 'medium' 
        ? theme.palette.warning.main 
        : theme.palette.error.main;
    
    return (
      <Chip 
        label={t(`insights.riskLevel.${level}`)} 
        size="small" 
        sx={{ 
          bgcolor: color, 
          color: '#fff', 
          fontWeight: 'bold' 
        }} 
      />
    );
  };

  // Render predictions content based on user role
  const renderPredictionsContent = () => {
    if (loading) {
      return <LinearProgress sx={{ my: 4 }} />;
    }

    if (error) {
      return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

    if (predictions.length === 0) {
      return <Alert severity="info" sx={{ my: 2 }}>{t('insights.noPredictions', 'No predictions available')}</Alert>;
    }

    if (userRole === 'student') {
      return (
        <Box>
          {predictions.map((prediction, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">
                    {prediction.courseId === 'OVERALL' 
                      ? t('insights.overallPerformance', 'Overall Performance') 
                      : `${prediction.courseId}`}
                  </Typography>
                  {renderRiskLevel(prediction.riskLevel)}
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('insights.predictedGrade', 'Predicted Grade')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {prediction.predictedGrade}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({Math.round(prediction.confidenceScore * 100)}% {t('insights.confidence', 'confidence')})
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('insights.contributingFactors', 'Contributing Factors')}
                </Typography>
                
                <List dense disablePadding>
                  {prediction.contributingFactors.map((factor, idx) => (
                    <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {factor.weight > 0.5 ? <ImproveIcon color="success" /> : <DeclineIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={factor.factor} 
                        secondary={`Impact: ${Math.round(factor.weight * 100)}%`} 
                      />
                    </ListItem>
                  ))}
                </List>

                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {t('insights.recommendations', 'Recommendations')}
                    </Typography>
                    <List dense disablePadding>
                      {prediction.recommendations.map((rec, idx) => (
                        <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <AIIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    } else if (userRole === 'faculty') {
      // Faculty view focuses on at-risk students
      return (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {t('insights.atRiskStudents', 'At-Risk Students')}
          </Typography>
          
          {predictions.map((prediction, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">
                    Student: {prediction.studentId}
                  </Typography>
                  {renderRiskLevel(prediction.riskLevel)}
                </Box>
                
                <Typography variant="body2">
                  {t('insights.predictedGrade', 'Predicted Grade')}: <strong>{prediction.predictedGrade}%</strong>
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2">
                  {t('insights.suggestedInterventions', 'Suggested Interventions')}
                </Typography>
                
                <List dense disablePadding>
                  {prediction.recommendations?.map((rec, idx) => (
                    <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AIIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }
    
    // Admin view (default)
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('insights.adminPredictionMessage', 'View comprehensive predictions in the analytics dashboard.')}
        </Alert>
        
        <Button 
          variant="outlined" 
          startIcon={<InsightsIcon />}
        >
          {t('insights.viewPredictionDashboard', 'View Prediction Dashboard')}
        </Button>
      </Box>
    );
  };

  // Render recommendations content
  const renderRecommendationsContent = () => {
    if (loading) {
      return <LinearProgress sx={{ my: 4 }} />;
    }

    if (error) {
      return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;
    }

    if (recommendations.length === 0) {
      return <Alert severity="info" sx={{ my: 2 }}>{t('insights.noRecommendations', 'No recommendations available')}</Alert>;
    }

    return (
      <Box>
        {recommendations.map((rec, index) => (
          <Card key={index} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">{rec.courseName}</Typography>
                <Chip 
                  label={`${Math.round(rec.relevanceScore * 100)}% ${t('insights.relevant', 'relevant')}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {rec.department} • {t(`insights.difficulty.${rec.expectedDifficulty}`, rec.expectedDifficulty)}
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('insights.whyRecommended', 'Why Recommended')}
              </Typography>
              
              <List dense disablePadding>
                {rec.reasonsForRecommendation.map((reason: string, idx: number) => (
                  <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AIIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={reason} />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {rec.skillsGained.slice(0, 2).map((skill: string, idx: number) => (
                    <Chip 
                      key={idx}
                      label={skill}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {rec.skillsGained.length > 2 && (
                    <Chip 
                      label={`+${rec.skillsGained.length - 2}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Button 
                  endIcon={<ArrowIcon />}
                  size="small"
                  sx={{ flexShrink: 0 }}
                  onClick={() => onInsightClick && onInsightClick(rec.courseId)}
                >
                  {t('insights.viewDetails', 'View Details')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
        
        <Button 
          variant="outlined" 
          fullWidth 
          sx={{ mt: 1 }}
          onClick={() => onInsightClick && onInsightClick('all-recommendations')}
        >
          {t('insights.viewAllRecommendations', 'View All Recommendations')}
        </Button>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button 
          variant={activeTab === 'predictions' ? 'contained' : 'outlined'} 
          startIcon={<TrendingUpIcon />} 
          onClick={() => setActiveTab('predictions')}
          size="small"
        >
          {t('insights.predictions', 'Predictions')}
        </Button>
        <Button 
          variant={activeTab === 'recommendations' ? 'contained' : 'outlined'} 
          startIcon={<SchoolIcon />} 
          onClick={() => setActiveTab('recommendations')}
          size="small"
        >
          {t('insights.recommendations', 'Recommendations')}
        </Button>
        <Tooltip title={t('insights.refresh', 'Refresh')}>
          <IconButton onClick={fetchInsights} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {activeTab === 'predictions' ? renderPredictionsContent() : renderRecommendationsContent()}
    </Box>
  );
};

export default InsightsPanel;