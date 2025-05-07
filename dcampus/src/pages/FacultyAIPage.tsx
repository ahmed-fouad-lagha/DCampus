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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  PersonSearch as PersonSearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Lightbulb as LightbulbIcon,
  Assignment as AssignmentIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';

// Import components
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import PredictiveService from '../services/predictiveService';
import RecommendationService from '../services/recommendationService';

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
      id={`ai-faculty-tabpanel-${index}`}
      aria-labelledby={`ai-faculty-tab-${index}`}
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

// Mock data for at-risk students
const mockAtRiskStudents = [
  {
    id: '1',
    name: 'Ahmed Bouazizi',
    riskScore: 0.87,
    photo: '',
    currentGrade: 58,
    lastLogin: '2 days ago',
    riskFactors: [
      'Poor attendance (4 absences)',
      'Late submission of 3 assignments',
      'Low quiz scores'
    ],
    email: 'ahmed.bouazizi@example.com',
    course: 'Computer Science 101'
  },
  {
    id: '2',
    name: 'Maria Rahal',
    riskScore: 0.75,
    photo: '',
    currentGrade: 62,
    lastLogin: '5 days ago',
    riskFactors: [
      'Decreasing quiz scores',
      'No forum participation',
      'Missed midterm deadline'
    ],
    email: 'maria.rahal@example.com',
    course: 'Data Structures'
  },
  {
    id: '3',
    name: 'Ibrahim Benali',
    riskScore: 0.68,
    photo: '',
    currentGrade: 65,
    lastLogin: '1 day ago',
    riskFactors: [
      'Inconsistent performance',
      'Struggles with practical assignments'
    ],
    email: 'ibrahim.benali@example.com',
    course: 'Algorithms'
  },
  {
    id: '4',
    name: 'Sophia Amrani',
    riskScore: 0.72,
    photo: '',
    currentGrade: 63,
    lastLogin: 'Today',
    riskFactors: [
      'Poor participation in group work',
      'Difficulty with core concepts'
    ],
    email: 'sophia.amrani@example.com',
    course: 'Computer Networks'
  }
];

// Mock data for class performance
const mockClassPerformance = {
  overallAverage: 76,
  highestPerforming: {
    topics: ['Database Design', 'Software Testing', 'Web Development'],
    scores: [87, 85, 82]
  },
  lowestPerforming: {
    topics: ['Algorithms Complexity', 'Network Security', 'Distributed Systems'],
    scores: [61, 63, 65]
  },
  gradeTrends: {
    increasing: 35,
    stable: 45,
    decreasing: 20
  },
  classEngagement: {
    high: 30,
    medium: 45,
    low: 25
  }
};

// Mock data for intervention strategies
const mockInterventionStrategies = [
  {
    id: '1',
    strategy: 'Personalized Email Outreach',
    description: 'Send targeted emails to struggling students with specific resources tailored to their areas of difficulty.',
    effectiveness: 'high',
    effort: 'medium',
    automationLevel: 'Partially automated (templates provided)'
  },
  {
    id: '2',
    strategy: 'Additional Review Sessions',
    description: 'Schedule small group review sessions focused on topics where students show the most difficulties.',
    effectiveness: 'high',
    effort: 'high',
    automationLevel: 'Manual planning, AI can identify focus areas'
  },
  {
    id: '3',
    strategy: 'Adaptive Practice Assignments',
    description: 'Assign additional practice problems that adapt to student skill level and target weak areas.',
    effectiveness: 'medium',
    effort: 'low',
    automationLevel: 'Fully automated generation and grading'
  },
  {
    id: '4',
    strategy: 'Peer Learning Partnerships',
    description: 'Pair struggling students with those who excel in complementary areas for mutual benefit.',
    effectiveness: 'medium',
    effort: 'medium',
    automationLevel: 'AI-assisted pairing suggestions'
  }
];

const FacultyAIPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, profile } = useAuth();
  const { trackEvent } = useAnalytics();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  
  const [atRiskStudents, setAtRiskStudents] = useState(mockAtRiskStudents);
  const [classPerformance, setClassPerformance] = useState(mockClassPerformance);
  const [interventionStrategies, setInterventionStrategies] = useState(mockInterventionStrategies);

  // Initialize services
  const predictiveService = new PredictiveService();
  const recommendationService = new RecommendationService();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, fetch data from backend/services
        // For now, we'll use mock data
        
        // Simulate network delay
        setTimeout(() => {
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching faculty AI data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Track page view
    trackEvent({
      category: 'AI Pages',
      action: 'Page View',
      label: 'Faculty AI Page'
    });
  }, [trackEvent]);

  // Filter students based on search term and filters
  const filteredStudents = atRiskStudents.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRiskFilter = riskFilter === 'all' ||
      (riskFilter === 'high' && student.riskScore >= 0.75) ||
      (riskFilter === 'medium' && student.riskScore >= 0.6 && student.riskScore < 0.75) ||
      (riskFilter === 'low' && student.riskScore < 0.6);
    
    const matchesCourseFilter = courseFilter === 'all' || 
      student.course === courseFilter;
    
    return matchesSearch && matchesRiskFilter && matchesCourseFilter;
  });

  // Get unique courses for filter dropdown
  const uniqueCourses = ['all', ...Array.from(new Set(atRiskStudents.map(s => s.course)))];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Track tab change
    const tabLabels = ['AtRisk', 'ClassPerformance', 'Interventions'];
    trackEvent({
      category: 'Faculty AI',
      action: 'Tab Change',
      label: tabLabels[newValue]
    });
  };

  // Function to render the At-Risk Students section
  const renderAtRiskStudents = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      );
    }

    return (
      <>
        {/* Search and filter controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('faculty.ai.atRisk.searchStudents')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="risk-level-filter-label">{t('faculty.ai.atRisk.riskLevel')}</InputLabel>
                  <Select
                    labelId="risk-level-filter-label"
                    value={riskFilter}
                    label={t('faculty.ai.atRisk.riskLevel')}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    startAdornment={<WarningIcon color="action" sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="all">{t('common.all')}</MenuItem>
                    <MenuItem value="high">{t('common.high')}</MenuItem>
                    <MenuItem value="medium">{t('common.medium')}</MenuItem>
                    <MenuItem value="low">{t('common.low')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="course-filter-label">{t('faculty.ai.atRisk.course')}</InputLabel>
                  <Select
                    labelId="course-filter-label"
                    value={courseFilter}
                    label={t('faculty.ai.atRisk.course')}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    startAdornment={<SchoolIcon color="action" sx={{ mr: 1 }} />}
                  >
                    {uniqueCourses.map((course) => (
                      <MenuItem key={course} value={course}>
                        {course === 'all' ? t('common.all') : course}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<FilterListIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    setRiskFilter('all');
                    setCourseFilter('all');
                  }}
                >
                  {t('common.reset')}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* At-risk students table */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {t('faculty.ai.atRisk.studentsIdentified', { count: filteredStudents.length })}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
              >
                {t('common.export')}
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('faculty.ai.atRisk.student')}</TableCell>
                    <TableCell>{t('faculty.ai.atRisk.riskScore')}</TableCell>
                    <TableCell>{t('faculty.ai.atRisk.currentGrade')}</TableCell>
                    <TableCell>{t('faculty.ai.atRisk.course')}</TableCell>
                    <TableCell>{t('faculty.ai.atRisk.lastActive')}</TableCell>
                    <TableCell>{t('faculty.ai.atRisk.riskFactors')}</TableCell>
                    <TableCell>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1 }}>{student.name.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {student.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${Math.round(student.riskScore * 100)}%`}
                            color={
                              student.riskScore >= 0.75
                                ? 'error'
                                : student.riskScore >= 0.6
                                ? 'warning'
                                : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              student.currentGrade < 60
                                ? 'error'
                                : student.currentGrade < 70
                                ? 'warning.main'
                                : 'text.primary'
                            }
                            fontWeight="medium"
                          >
                            {student.currentGrade}%
                          </Typography>
                        </TableCell>
                        <TableCell>{student.course}</TableCell>
                        <TableCell>{student.lastLogin}</TableCell>
                        <TableCell>
                          <List dense disablePadding>
                            {student.riskFactors.map((factor, idx) => (
                              <ListItem key={idx} disablePadding disableGutters>
                                <ListItemText
                                  primary={
                                    <Typography variant="caption">• {factor}</Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title={t('faculty.ai.atRisk.viewProfile')}>
                              <IconButton size="small">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('faculty.ai.atRisk.sendEmail')}>
                              <IconButton size="small">
                                <EmailIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('faculty.ai.atRisk.getRecommendations')}>
                              <IconButton size="small">
                                <LightbulbIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {t('faculty.ai.atRisk.noStudentsFound')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </>
    );
  };

  // Function to render the Class Performance section
  const renderClassPerformance = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={300} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
          </Grid>
        </Box>
      );
    }

    return (
      <>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('faculty.ai.classPerformance.overallPerformance')}
            </Typography>
            <Box sx={{ height: 400 }}>
              <AnalyticsChart 
                chartType="performance" 
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
                  {t('faculty.ai.classPerformance.topicsAnalysis')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {t('faculty.ai.classPerformance.strongTopics')}
                </Typography>
                <List dense>
                  {classPerformance.highestPerforming.topics.map((topic, idx) => (
                    <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Chip 
                          label={`${classPerformance.highestPerforming.scores[idx]}%`}
                          size="small"
                          color="success"
                        />
                      </ListItemIcon>
                      <ListItemText primary={topic} />
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" color="error" gutterBottom>
                  {t('faculty.ai.classPerformance.challengingTopics')}
                </Typography>
                <List dense>
                  {classPerformance.lowestPerforming.topics.map((topic, idx) => (
                    <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Chip 
                          label={`${classPerformance.lowestPerforming.scores[idx]}%`}
                          size="small"
                          color="error"
                        />
                      </ListItemIcon>
                      <ListItemText primary={topic} />
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssignmentIcon />}
                  >
                    {t('faculty.ai.classPerformance.generatePractice')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('faculty.ai.classPerformance.performanceTrends')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {t('faculty.ai.classPerformance.gradeTrends')}:
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Chip
                      label={`${classPerformance.gradeTrends.increasing}% ${t('faculty.ai.classPerformance.improving')}`}
                      color="success"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${classPerformance.gradeTrends.stable}% ${t('faculty.ai.classPerformance.stable')}`}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`${classPerformance.gradeTrends.decreasing}% ${t('faculty.ai.classPerformance.declining')}`}
                      color="error"
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('faculty.ai.classPerformance.classAverage')}: {classPerformance.overallAverage}%
                  </Typography>
                  <Box
                    sx={{
                      height: 10,
                      width: '100%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: 5,
                      position: 'relative',
                      mb: 1
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        height: '100%',
                        width: `${classPerformance.overallAverage}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 5
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('faculty.ai.classPerformance.classEngagement')}:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          textAlign: 'center',
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                        }}
                      >
                        <Typography variant="h5" color="success.main">
                          {classPerformance.classEngagement.high}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('common.high')}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          textAlign: 'center',
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        }}
                      >
                        <Typography variant="h5" color="info.main">
                          {classPerformance.classEngagement.medium}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('common.medium')}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          textAlign: 'center',
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                        }}
                      >
                        <Typography variant="h5" color="warning.main">
                          {classPerformance.classEngagement.low}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('common.low')}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<DownloadIcon />}
                  >
                    {t('faculty.ai.classPerformance.generateReport')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  // Function to render the Intervention Strategies section
  const renderInterventionStrategies = () => {
    if (loading) {
      return (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      );
    }

    return (
      <>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <HelpIcon color="info" sx={{ mt: 0.5, mr: 2 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('faculty.ai.interventions.about')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('faculty.ai.interventions.description')}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ pl: 5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label="1" 
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1 }} 
                  />
                  <Typography variant="body2">
                    {t('faculty.ai.interventions.step1')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label="2" 
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1 }} 
                  />
                  <Typography variant="body2">
                    {t('faculty.ai.interventions.step2')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label="3" 
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1 }} 
                  />
                  <Typography variant="body2">
                    {t('faculty.ai.interventions.step3')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('faculty.ai.interventions.recommendedStrategies')}
        </Typography>
        
        <Grid container spacing={3}>
          {interventionStrategies.map((strategy) => (
            <Grid item xs={12} md={6} key={strategy.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom>
                      {strategy.strategy}
                    </Typography>
                    <Chip 
                      label={t(`common.${strategy.effectiveness}`)} 
                      color={strategy.effectiveness === 'high' ? 'success' : 'primary'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {strategy.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('faculty.ai.interventions.effortRequired')}:
                      </Typography>
                      <Chip 
                        label={t(`common.${strategy.effort}`)} 
                        size="small"
                        color={strategy.effort === 'low' ? 'success' : strategy.effort === 'medium' ? 'primary' : 'warning'}
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('faculty.ai.interventions.automation')}:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {strategy.automationLevel}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button variant="outlined">
                      {t('faculty.ai.interventions.implementStrategy')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<PersonSearchIcon />}
            size="large"
          >
            {t('faculty.ai.interventions.getCustomStrategy')}
          </Button>
        </Box>
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
          background: `linear-gradient(to right, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {t('faculty.ai.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('faculty.ai.description')}
        </Typography>
      </Paper>

      {/* Tabs navigation */}
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="faculty ai tabs"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab 
            icon={<WarningIcon />} 
            iconPosition="start" 
            label={t('faculty.ai.atRisk.title')} 
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label={t('faculty.ai.classPerformance.title')} 
          />
          <Tab 
            icon={<LightbulbIcon />} 
            iconPosition="start" 
            label={t('faculty.ai.interventions.title')} 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderAtRiskStudents()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderClassPerformance()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderInterventionStrategies()}
      </TabPanel>
    </Box>
  );
};

export default FacultyAIPage;