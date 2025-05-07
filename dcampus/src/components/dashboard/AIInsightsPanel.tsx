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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Stack,
  Rating,
  CircularProgress
} from '@mui/material';
import {
  Insights as InsightsIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Book as BookIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

// Import AI services
import PredictiveService, { 
  PerformancePredictionResult, 
  DropoutPredictionResult 
} from '../../services/predictiveService';
import RecommendationService, { 
  CourseRecommendation, 
  ResourceRecommendation 
} from '../../services/recommendationService';

interface AIInsightsPanelProps {
  userId?: string;
  userRole?: 'student' | 'faculty' | 'admin';
}

interface Insight {
  id: string;
  type: 'prediction' | 'recommendation' | 'alert' | 'trend';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  icon?: React.ReactNode;
  data?: any;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ userId, userRole }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [detailedInsight, setDetailedInsight] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  
  const theme = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();

  // Use profile info if props are not provided
  const actualUserId = userId || profile?.user_id || '';
  const actualUserRole = userRole || profile?.role || 'student';

  // Initialize AI services
  const predictiveService = new PredictiveService();
  const recommendationService = new RecommendationService();

  // Fetch AI insights data
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    setRefreshing(true);

    try {
      const insights: Insight[] = [];
      
      // Different insights based on user role
      if (actualUserRole === 'student') {
        // Get student performance prediction
        const performancePrediction = await predictiveService.getMockPerformanceData(actualUserId);
        
        if (performancePrediction.success && performancePrediction.data) {
          const performance = performancePrediction.data;
          
          insights.push({
            id: 'perf-prediction',
            type: 'prediction',
            title: t('ai.insights.performancePrediction'),
            content: `${t('ai.insights.projectedGrade')}: ${performance.predictedGrade}% (${t('ai.insights.confidence')}: ${Math.round(performance.confidenceScore * 100)}%)`,
            priority: performance.riskLevel,
            icon: <TrendingUpIcon color={performance.predictedPerformanceTrend === 'improving' ? 'success' : performance.predictedPerformanceTrend === 'declining' ? 'error' : 'primary'} />,
            data: performance
          });
        }

        // Get dropout risk prediction
        const dropoutPrediction = await predictiveService.getMockDropoutRiskData(actualUserId);
        
        if (dropoutPrediction.success && dropoutPrediction.data) {
          const dropout = dropoutPrediction.data;
          const riskLevel = dropout.dropoutRisk < 0.2 ? 'low' : dropout.dropoutRisk < 0.5 ? 'medium' : 'high';
          
          insights.push({
            id: 'dropout-prediction',
            type: 'prediction',
            title: t('ai.insights.dropoutRiskAnalysis'),
            content: `${t('ai.insights.dropoutRisk')}: ${Math.round(dropout.dropoutRisk * 100)}% ${t('ai.insights.withinTimeframe')} ${dropout.timeHorizon}`,
            priority: riskLevel,
            icon: <WarningIcon color={riskLevel === 'low' ? 'success' : riskLevel === 'medium' ? 'warning' : 'error'} />,
            data: dropout
          });
        }

        // Get course recommendations
        const courseRecommendations = await recommendationService.getMockCourseRecommendations(actualUserId);
        
        if (courseRecommendations.success && courseRecommendations.data && courseRecommendations.data.length > 0) {
          insights.push({
            id: 'course-recommendations',
            type: 'recommendation',
            title: t('ai.insights.courseRecommendations'),
            content: `${t('ai.insights.topCourseRecommendation')}: ${courseRecommendations.data[0].courseName} (${Math.round(courseRecommendations.data[0].matchScore * 100)}% ${t('ai.insights.match')})`,
            priority: 'medium',
            icon: <SchoolIcon color="primary" />,
            data: courseRecommendations.data
          });
        }

        // Get resource recommendations
        const resourceRecommendations = await recommendationService.getMockResourceRecommendations(actualUserId);
        
        if (resourceRecommendations.success && resourceRecommendations.data && resourceRecommendations.data.length > 0) {
          insights.push({
            id: 'resource-recommendations',
            type: 'recommendation',
            title: t('ai.insights.resourceRecommendations'),
            content: `${t('ai.insights.recommendedResource')}: ${resourceRecommendations.data[0].title}`,
            priority: 'low',
            icon: <BookIcon color="primary" />,
            data: resourceRecommendations.data
          });
        }
      } else if (actualUserRole === 'faculty') {
        // Sample faculty insights with mock data
        const atRiskStudentCount = Math.floor(Math.random() * 5) + 1;
        
        insights.push({
          id: 'at-risk-students',
          type: 'alert',
          title: t('ai.insights.atRiskStudents'),
          content: `${atRiskStudentCount} ${t('ai.insights.studentsNeedSupport')}`,
          priority: atRiskStudentCount > 3 ? 'high' : 'medium',
          icon: <WarningIcon color={atRiskStudentCount > 3 ? 'error' : 'warning'} />,
          data: {
            count: atRiskStudentCount,
            students: Array(atRiskStudentCount).fill(0).map((_, i) => ({
              id: `student-${i}`,
              name: `Student ${i + 1}`,
              riskScore: Math.random() * 0.5 + 0.5,
              riskFactors: ['Attendance issues', 'Late assignments', 'Poor quiz performance'].slice(0, Math.floor(Math.random() * 3) + 1)
            }))
          }
        });
        
        insights.push({
          id: 'course-effectiveness',
          type: 'trend',
          title: t('ai.insights.courseEffectivenessAnalysis'),
          content: `${t('ai.insights.coursePerformingWell')} ${Math.round(Math.random() * 15 + 10)}% ${t('ai.insights.aboveAverage')}`,
          priority: 'low',
          icon: <TrendingUpIcon color="success" />,
          data: {
            effectivenessScore: Math.random() * 30 + 70,
            areas: {
              content: Math.random() * 20 + 80,
              delivery: Math.random() * 20 + 80,
              assessment: Math.random() * 20 + 80,
              engagement: Math.random() * 20 + 80
            }
          }
        });
      } else {
        // Admin insights
        const enrollmentChange = Math.random() * 20 - 5; // -5% to +15%
        
        insights.push({
          id: 'enrollment-prediction',
          type: 'trend',
          title: t('ai.insights.enrollmentPrediction'),
          content: `${t('ai.insights.expectedEnrollment')}: ${Math.floor(Math.random() * 500 + 2000)} (${enrollmentChange > 0 ? '+' : ''}${Math.round(enrollmentChange)}% ${t('ai.insights.fromPrevious')})`,
          priority: enrollmentChange < -3 ? 'high' : enrollmentChange < 0 ? 'medium' : 'low',
          icon: enrollmentChange >= 0 ? <ArrowUpIcon color="success" /> : <ArrowDownIcon color="error" />,
          data: {
            totalPredicted: Math.floor(Math.random() * 500 + 2000),
            changePercent: enrollmentChange,
            byDepartment: [
              { department: 'Computer Science', predicted: Math.floor(Math.random() * 200 + 400), change: Math.random() * 15 - 2 },
              { department: 'Business', predicted: Math.floor(Math.random() * 200 + 500), change: Math.random() * 10 - 1 },
              { department: 'Engineering', predicted: Math.floor(Math.random() * 200 + 300), change: Math.random() * 12 - 3 },
              { department: 'Humanities', predicted: Math.floor(Math.random() * 100 + 200), change: Math.random() * 10 - 5 }
            ]
          }
        });
        
        insights.push({
          id: 'resource-utilization',
          type: 'alert',
          title: t('ai.insights.resourceUtilization'),
          content: t('ai.insights.resourceAllocationSuggestion'),
          priority: 'medium',
          icon: <InsightsIcon color="primary" />,
          data: {
            summary: 'Potential to optimize classroom usage patterns',
            recommendations: [
              { area: 'Library Study Rooms', utilization: 92, recommendation: 'Increase capacity by 15%' },
              { area: 'Computer Labs', utilization: 58, recommendation: 'Reduce hours during low-usage periods' },
              { area: 'Lecture Halls', utilization: 45, recommendation: 'Consolidate smaller classes' }
            ]
          }
        });
      }
      
      setInsights(insights);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(t('ai.insights.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load insights when component mounts
  useEffect(() => {
    fetchInsights();
  }, [actualUserId, actualUserRole]);

  // Open detail dialog with selected insight data
  const handleOpenDetail = (insight: Insight) => {
    setDetailedInsight(insight);
    setDialogType(insight.type);
    setDialogOpen(true);
  };

  // Close detail dialog
  const handleCloseDetail = () => {
    setDialogOpen(false);
  };

  // Render performance prediction details
  const renderPerformanceDetail = () => {
    const performance = detailedInsight?.data as PerformancePredictionResult;
    if (!performance) return null;
    
    return (
      <>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <CircularProgress
            variant="determinate"
            value={performance.predictedGrade}
            size={120}
            thickness={5}
            sx={{ color: performance.riskLevel === 'low' ? 'success.main' : performance.riskLevel === 'medium' ? 'warning.main' : 'error.main' }}
          />
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Typography variant="h4" component="div" color="text.secondary">
              {performance.predictedGrade}%
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            {t('ai.insights.confidenceScore')}: {Math.round(performance.confidenceScore * 100)}%
          </Typography>
          <Chip 
            label={t(`ai.insights.trend.${performance.predictedPerformanceTrend}`)} 
            color={performance.predictedPerformanceTrend === 'improving' ? 'success' : performance.predictedPerformanceTrend === 'declining' ? 'error' : 'primary'}
            sx={{ mt: 1 }}
          />
        </Box>
        
        <Typography variant="h6" gutterBottom>{t('ai.insights.riskFactors')}</Typography>
        {performance.riskFactors && performance.riskFactors.length > 0 ? (
          <List>
            {performance.riskFactors.map((factor, idx) => (
              <ListItem key={idx} sx={{ px: 0 }}>
                <ListItemIcon>
                  <WarningIcon color={factor.impact > 0.7 ? 'error' : factor.impact > 0.4 ? 'warning' : 'info'} />
                </ListItemIcon>
                <ListItemText 
                  primary={factor.factor} 
                  secondary={factor.description}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">{t('ai.insights.noRiskFactors')}</Typography>
        )}
        
        {performance.recommendedActions && performance.recommendedActions.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>{t('ai.insights.recommendedActions')}</Typography>
            <List>
              {performance.recommendedActions.map((action, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckIcon color={action.priority === 'high' ? 'error' : action.priority === 'medium' ? 'warning' : 'success'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={action.action} 
                    secondary={action.description}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </>
    );
  };

  // Render course recommendations details
  const renderCourseRecommendations = () => {
    const courses = detailedInsight?.data as CourseRecommendation[];
    if (!courses || courses.length === 0) return null;
    
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {t('ai.insights.personalizedCourses')}
        </Typography>
        
        <Stack spacing={2} sx={{ mt: 2 }}>
          {courses.map((course, idx) => (
            <Paper key={idx} sx={{ p: 2 }} variant="outlined">
              <Typography variant="h6" gutterBottom>{course.courseName}</Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {course.courseCode} • {t('ai.insights.credits')}: {course.creditHours}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {t('ai.insights.matchScore')}:
                </Typography>
                <Chip 
                  label={`${Math.round(course.matchScore * 100)}%`} 
                  color="primary" 
                  size="small" 
                />
              </Box>
              
              {course.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {t('ai.insights.rating')}:
                  </Typography>
                  <Rating value={course.rating} precision={0.5} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({course.rating}/5)
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {course.description}
              </Typography>
              
              {course.reasons && course.reasons.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('ai.insights.whyThisCourse')}:
                  </Typography>
                  <List dense>
                    {course.reasons.map((reason, rIdx) => (
                      <ListItem key={rIdx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: '30px' }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={reason.reason} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              
              {course.prerequisites && course.prerequisites.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>{t('ai.insights.prerequisites')}</strong>: {course.prerequisites.join(', ')}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>
      </>
    );
  };

  // Render resource recommendations details
  const renderResourceRecommendations = () => {
    const resources = detailedInsight?.data as ResourceRecommendation[];
    if (!resources || resources.length === 0) return null;
    
    return (
      <>
        <Typography variant="subtitle1" gutterBottom>
          {t('ai.insights.personalizedResources')}
        </Typography>
        
        <Stack spacing={2} sx={{ mt: 2 }}>
          {resources.map((resource, idx) => (
            <Paper key={idx} sx={{ p: 2 }} variant="outlined">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6">{resource.title}</Typography>
                <Chip 
                  label={resource.type} 
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {resource.creator && `${resource.creator} • `}
                {t(`ai.insights.difficulty.${resource.difficulty}`)}
                {resource.duration && ` • ${resource.duration} ${resource.type === 'video' ? t('ai.insights.minutes') : t('ai.insights.readingMinutes')}`}
              </Typography>
              
              <Typography variant="body2" paragraph>
                {resource.description}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {resource.topics.map((topic, tIdx) => (
                  <Chip key={tIdx} label={topic} size="small" />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  {t('ai.insights.matchScore')}: <strong>{Math.round(resource.matchScore * 100)}%</strong>
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('ai.insights.accessResource')}
                </Button>
              </Box>
              
              {resource.reasons && resource.reasons.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>
                    {t('ai.insights.whyThisResource')}:
                  </Typography>
                  <List dense>
                    {resource.reasons.map((reason, rIdx) => (
                      <ListItem key={rIdx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: '30px' }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={reason.reason} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Paper>
          ))}
        </Stack>
      </>
    );
  };

  // Render dialog content based on type
  const renderDialogContent = () => {
    switch (dialogType) {
      case 'prediction':
        if (detailedInsight?.id === 'perf-prediction') {
          return renderPerformanceDetail();
        } else {
          // Other prediction types
          return <Typography>Detailed information about this prediction</Typography>;
        }
      case 'recommendation':
        if (detailedInsight?.id === 'course-recommendations') {
          return renderCourseRecommendations();
        } else if (detailedInsight?.id === 'resource-recommendations') {
          return renderResourceRecommendations();
        } else {
          return <Typography>Detailed information about this recommendation</Typography>;
        }
      default:
        return <Typography>Additional information not available</Typography>;
    }
  };

  // Display priority indicator chip
  const renderPriorityChip = (priority: 'high' | 'medium' | 'low') => {
    const color = priority === 'high' 
      ? theme.palette.error.main 
      : priority === 'medium' 
        ? theme.palette.warning.main 
        : theme.palette.success.main;
    
    const label = t(`ai.insights.priority.${priority}`);
    
    return (
      <Chip 
        label={label} 
        size="small" 
        sx={{ 
          bgcolor: color, 
          color: '#fff', 
          fontWeight: 'bold' 
        }} 
      />
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 1 }} color="primary" />
            {t('ai.insights.title')}
          </Typography>
          
          <Tooltip title={t('ai.insights.refresh')}>
            <IconButton onClick={fetchInsights} disabled={loading || refreshing}>
              <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>
        
        {loading ? (
          <LinearProgress sx={{ my: 4 }} />
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : insights.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>{t('ai.insights.noInsights')}</Alert>
        ) : (
          <List sx={{ p: 0 }}>
            {insights.map((insight, index) => (
              <React.Fragment key={insight.id}>
                {index > 0 && <Divider />}
                <ListItem 
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => handleOpenDetail(insight)}
                >
                  <ListItemIcon>
                    {insight.icon || <InsightsIcon color="primary" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{insight.title}</Typography>
                        {renderPriorityChip(insight.priority)}
                      </Box>
                    }
                    secondary={insight.content}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Button 
          variant="outlined" 
          fullWidth 
          sx={{ mt: 2 }}
          startIcon={<InsightsIcon />}
          disabled={loading || insights.length === 0}
          onClick={() => insights.length > 0 && handleOpenDetail(insights[0])}
        >
          {t('ai.insights.viewDetails')}
        </Button>
      </CardContent>

      {/* Detail dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDetail} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {detailedInsight?.title}
        </DialogTitle>
        <DialogContent sx={{ position: 'relative', minHeight: '300px', pt: 2 }}>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AIInsightsPanel;