import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Divider, 
  Skeleton,
  Paper,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating,
  Avatar,
  LinearProgress,
  useTheme
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';

// Import components
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import PredictiveService, { PerformancePredictionResult } from '../services/predictiveService';
import RecommendationService, { CourseRecommendation, ResourceRecommendation } from '../services/recommendationService';

// Extended interface to include missing properties used in this component
interface ExtendedPerformancePredictionResult extends PerformancePredictionResult {
  currentGrade?: number;
  strengths?: { area: string; details: string }[];
  weaknesses?: { area: string; details: string }[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StudentAIPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [performanceData, setPerformanceData] = useState<ExtendedPerformancePredictionResult | null>(null);
  const [courseRecommendations, setCourseRecommendations] = useState<CourseRecommendation[]>([]);
  const [resourceRecommendations, setResourceRecommendations] = useState<ResourceRecommendation[]>([]);

  // Initialize services
  const predictiveService = new PredictiveService();
  const recommendationService = new RecommendationService();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch performance data
        const performanceResponse = await predictiveService.getMockPerformanceData(user?.id || '1');
        if (performanceResponse.success && performanceResponse.data) {
          setPerformanceData(performanceResponse.data);
        }

        // Fetch course recommendations
        const coursesResponse = await recommendationService.getMockCourseRecommendations(user?.id || '1');
        if (coursesResponse.success && coursesResponse.data) {
          setCourseRecommendations(coursesResponse.data);
        }

        // Fetch resource recommendations
        const resourcesResponse = await recommendationService.getMockResourceRecommendations(user?.id || '1');
        if (resourcesResponse.success && resourcesResponse.data) {
          setResourceRecommendations(resourcesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching AI data:', error);
      } finally {
        // Simulate network delay for better UX
        setTimeout(() => {
          setLoading(false);
        }, 800);
      }
    };

    fetchData();

    // Track page view
    trackEvent({
      category: 'AI Pages',
      action: 'Page View',
      label: 'Student AI Page'
    });
  }, [user?.id, trackEvent, predictiveService, recommendationService]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Track tab change
    const tabLabels = ['Performance', 'Recommendations', 'Engagement'];
    trackEvent({
      category: 'Student AI',
      action: 'Tab Change',
      label: tabLabels[newValue]
    });
  };

  // Function to render the performance analysis section
  const renderPerformanceAnalysis = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={300} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" height={120} width="50%" />
            <Skeleton variant="rectangular" height={120} width="50%" />
          </Box>
        </Box>
      );
    }

    if (!performanceData) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {t('errors.somethingWentWrong')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('errors.tryAgainLater')}
          </Typography>
        </Paper>
      );
    }

    return (
      <>
        {/* Performance Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: performanceData.riskLevel === 'high' 
                  ? alpha(theme.palette.error.main, 0.1) 
                  : performanceData.riskLevel === 'medium'
                    ? alpha(theme.palette.warning.main, 0.1)
                    : alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${performanceData.riskLevel === 'high' 
                  ? alpha(theme.palette.error.main, 0.3) 
                  : performanceData.riskLevel === 'medium'
                    ? alpha(theme.palette.warning.main, 0.3)
                    : alpha(theme.palette.success.main, 0.3)}`,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography variant="overline" color="textSecondary" gutterBottom>
                  {t('ai.analytics.performance.currentGrade')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
                  <Typography variant="h3" component="div" fontWeight="bold" sx={{ mr: 1 }}>
                    {performanceData.currentGrade}%
                  </Typography>
                </Box>
                <Typography variant="overline" color="textSecondary" gutterBottom>
                  {t('ai.analytics.performance.predictedGrade')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Typography variant="h4" component="div" fontWeight="medium">
                    {performanceData.predictedGrade}%
                  </Typography>
                  <Chip 
                    size="small"
                    icon={performanceData.predictedPerformanceTrend === 'improving' 
                      ? <TrendingUpIcon /> 
                      : performanceData.predictedPerformanceTrend === 'declining' 
                        ? <ErrorOutlineIcon /> 
                        : <TimelineIcon />}
                    label={t(`ai.insights.trend.${performanceData.predictedPerformanceTrend}`)}
                    color={performanceData.predictedPerformanceTrend === 'improving' 
                      ? 'success' 
                      : performanceData.predictedPerformanceTrend === 'declining' 
                        ? 'error' 
                        : 'primary'}
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {t('ai.insights.confidence')}: {Math.round(performanceData.confidenceScore * 100)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('ai.analytics.performance.strengthsAndWeaknesses')}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {t('ai.analytics.performance.strengthsAndWeaknesses')}
                    </Typography>
                    <List dense disablePadding>
                      {performanceData.strengths && performanceData.strengths.map((strength, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={strength.area} 
                            secondary={strength.details}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      {t('ai.analytics.performance.improvementAreas')}
                    </Typography>
                    <List dense disablePadding>
                      {performanceData.weaknesses && performanceData.weaknesses.map((weakness, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <ErrorOutlineIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={weakness.area} 
                            secondary={weakness.details}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Chart */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('ai.analytics.performance.gradeHistory')}
            </Typography>
            <Box sx={{ height: 400 }}>
              <AnalyticsChart 
                chartType="performance" 
                height={350}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Study Recommendations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('ai.analytics.performance.studyRecommendations')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {performanceData.recommendedActions && (
              <List>
                {performanceData.recommendedActions.map((action, idx) => (
                  <ListItem key={idx} alignItems="flex-start">
                    <ListItemIcon>
                      <LightbulbIcon color={action.priority === 'high' ? 'error' : action.priority === 'medium' ? 'warning' : 'success'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {action.action}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {action.description}
                          </Typography>
                          <Button size="small" variant="outlined" color="primary" startIcon={<MenuBookIcon />}>
                            {t('common.explore')}
                          </Button>
                        </>
                      }
                    />
                    <Chip 
                      size="small" 
                      label={t(`ai.insights.priority.${action.priority}`)} 
                      color={action.priority === 'high' ? 'error' : action.priority === 'medium' ? 'warning' : 'success'} 
                      sx={{ alignSelf: 'flex-start' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </>
    );
  };

  // Function to render the recommendations section
  const renderRecommendations = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={150} />
        </Box>
      );
    }

    return (
      <>
        {/* Course Recommendations */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('ai.analytics.recommendations.courses')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('ai.insights.personalizedCourses')}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {courseRecommendations.length > 0 ? (
              <Grid container spacing={3}>
                {courseRecommendations.slice(0, 3).map((course, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Paper 
                      elevation={0} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0,
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `linear-gradient(135deg, transparent 0%, transparent 50%, ${alpha(theme.palette.primary.main, 0.2)} 50%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            transform: 'rotate(45deg) translate(15px, -5px)', 
                            fontWeight: 'bold',
                            color: theme.palette.primary.main
                          }}
                        >
                          {Math.round(course.matchScore * 100)}%
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {course.courseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {course.courseCode} • {t('ai.insights.credits')}: {course.creditHours}
                      </Typography>
                      
                      {course.rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating value={course.rating} precision={0.5} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({course.rating})
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                        {course.description}
                      </Typography>
                      
                      <Button variant="outlined" size="small" fullWidth>
                        {t('common.details')}
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                {t('analytics.errors.noData')}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<SchoolIcon />}
              >
                {t('common.explore')} {t('ai.analytics.recommendations.courses')}
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        {/* Learning Resources */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('ai.analytics.recommendations.resources')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('ai.insights.personalizedResources')}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {resourceRecommendations.length > 0 ? (
              <List>
                {resourceRecommendations.slice(0, 4).map((resource, idx) => (
                  <Paper 
                    key={idx} 
                    variant="outlined"
                    sx={{ 
                      mb: 2, 
                      overflow: 'hidden',
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <ListItem sx={{ px: 3, py: 2 }}>
                      <Box sx={{ display: 'flex', width: '100%' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: 2
                          }}
                        >
                          {resource.type === 'video' ? 'V' : resource.type === 'article' ? 'A' : 'R'}
                        </Avatar>
                        
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                              {resource.title}
                            </Typography>
                            <Chip 
                              label={`${Math.round(resource.matchScore * 100)}% ${t('ai.insights.match')}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary">
                            {resource.creator && `${resource.creator} • `}
                            {t(`ai.insights.difficulty.${resource.difficulty}`)}
                            {resource.duration && ` • ${resource.duration} ${resource.type === 'video' ? t('ai.insights.minutes') : t('ai.insights.readingMinutes')}`}
                          </Typography>
                          
                          <Typography variant="body2" paragraph sx={{ mt: 1, mb: 1.5 }}>
                            {resource.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                            {resource.topics.map((topic, tIdx) => (
                              <Chip key={tIdx} label={topic} size="small" />
                            ))}
                          </Box>
                          
                          <Button
                            variant="contained"
                            size="small"
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('ai.insights.accessResource')}
                          </Button>
                        </Box>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                {t('analytics.errors.noData')}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="contained" 
                color="secondary"
                startIcon={<MenuBookIcon />}
              >
                {t('common.explore')} {t('ai.analytics.recommendations.resources')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </>
    );
  };

  // Function to render the engagement section
  const renderEngagement = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={350} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={200} />
        </Box>
      );
    }

    return (
      <>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('ai.analytics.engagement.overallEngagement')}
            </Typography>
            <Box sx={{ height: 400 }}>
              <AnalyticsChart 
                chartType="engagement" 
                height={350}
              />
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('ai.analytics.engagement.resourceUsage')}
                </Typography>
                <Box sx={{ height: 300 }}>
                  <AnalyticsChart 
                    chartType="resources" 
                    height={250}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('ai.analytics.engagement.participationScore')}
                </Typography>
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('ai.analytics.engagement.discussions')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={78} 
                        sx={{ height: 10, borderRadius: 1 }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">78%</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('ai.analytics.engagement.assignments')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={92} 
                        color="success"
                        sx={{ height: 10, borderRadius: 1 }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">92%</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('ai.analytics.engagement.quizzes')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={85} 
                        color="info"
                        sx={{ height: 10, borderRadius: 1 }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">85%</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('ai.analytics.engagement.projects')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={67} 
                        color="warning"
                        sx={{ height: 10, borderRadius: 1 }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">67%</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('ai.analytics.engagement.peakTimes')}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Chip icon={<TimelineIcon />} label="7-9 PM" size="small" />
                    <Chip icon={<TimelineIcon />} label="Weekend" size="small" />
                    <Chip icon={<BarChartIcon />} label="3 hr/day avg." size="small" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box>
      {/* Page Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.1)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {t('ai.analytics.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('ai.analytics.performance.description')}
        </Typography>
      </Paper>

      {/* Tabs navigation */}
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="ai student tabs"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab 
            icon={<TrendingUpIcon />} 
            iconPosition="start" 
            label={t('ai.analytics.performance.title')} 
          />
          <Tab 
            icon={<SchoolIcon />} 
            iconPosition="start" 
            label={t('ai.analytics.recommendations.title')} 
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label={t('ai.analytics.engagement.title')} 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderPerformanceAnalysis()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderRecommendations()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderEngagement()}
      </TabPanel>
    </Box>
  );
};

export default StudentAIPage;