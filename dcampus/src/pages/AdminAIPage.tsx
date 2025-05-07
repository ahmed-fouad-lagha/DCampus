import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Tab, Tabs, Grid,
  Card, CardContent, CircularProgress, Alert, Button,
  Divider, useTheme, Chip, MenuItem, Select,
  SelectChangeEvent, InputLabel, FormControl, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  School as SchoolIcon,
  Business as InstitutionIcon,
  TrendingUp as TrendingIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// Import components
import AnalyticsChart from '../components/dashboard/AnalyticsChart';

// TabPanel component for tab content
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
      id={`admin-ai-tabpanel-${index}`}
      aria-labelledby={`admin-ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Define interfaces for data types
interface PerformanceMetric {
  id: string;
  category: string;
  name: string;
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  goalValue?: number;
  unit: string;
}

// Mock data for institutional analytics
const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    id: 'metric-1',
    category: 'Academic',
    name: 'Average GPA',
    currentValue: 3.2,
    previousValue: 3.1,
    trend: 'up',
    goalValue: 3.5,
    unit: 'GPA'
  },
  {
    id: 'metric-2',
    category: 'Academic',
    name: 'Graduation Rate',
    currentValue: 78.5,
    previousValue: 76.2,
    trend: 'up',
    goalValue: 85,
    unit: '%'
  },
  {
    id: 'metric-3',
    category: 'Engagement',
    name: 'Course Completion Rate',
    currentValue: 91.4,
    previousValue: 93.2,
    trend: 'down',
    goalValue: 95,
    unit: '%'
  },
  {
    id: 'metric-4',
    category: 'Engagement',
    name: 'Platform Active Users',
    currentValue: 2850,
    previousValue: 2400,
    trend: 'up',
    goalValue: 3000,
    unit: 'users'
  },
  {
    id: 'metric-5',
    category: 'Resources',
    name: 'Faculty-Student Ratio',
    currentValue: 1/16,
    previousValue: 1/18,
    trend: 'up',
    goalValue: 1/15,
    unit: 'ratio'
  },
  {
    id: 'metric-6',
    category: 'Resources',
    name: 'Resource Utilization',
    currentValue: 68.4,
    previousValue: 65.1,
    trend: 'up',
    goalValue: 75,
    unit: '%'
  }
];

// Mock data for resource allocation
interface ResourceAllocation {
  departmentId: string;
  departmentName: string;
  currentAllocation: number;
  optimalAllocation: number;
  justification: string;
  impact: number; // 0-1
  priority: 'low' | 'medium' | 'high';
}

const mockResourceAllocations: ResourceAllocation[] = [
  {
    departmentId: 'CS',
    departmentName: 'Computer Science',
    currentAllocation: 1250000,
    optimalAllocation: 1450000,
    justification: 'Increasing enrollment and need for updated lab equipment',
    impact: 0.82,
    priority: 'high'
  },
  {
    departmentId: 'BUS',
    departmentName: 'Business Administration',
    currentAllocation: 980000,
    optimalAllocation: 1050000,
    justification: 'New entrepreneurship program launch and industry partnerships',
    impact: 0.75,
    priority: 'medium'
  },
  {
    departmentId: 'ENG',
    departmentName: 'Engineering',
    currentAllocation: 1500000,
    optimalAllocation: 1700000,
    justification: 'Growing enrollment and need for state-of-the-art equipment',
    impact: 0.88,
    priority: 'high'
  },
  {
    departmentId: 'HUM',
    departmentName: 'Humanities',
    currentAllocation: 720000,
    optimalAllocation: 680000,
    justification: 'Declining enrollment, but critical to maintain core programs',
    impact: 0.62,
    priority: 'medium'
  },
  {
    departmentId: 'SCI',
    departmentName: 'Natural Sciences',
    currentAllocation: 1100000,
    optimalAllocation: 1200000,
    justification: 'Research opportunities and lab modernization',
    impact: 0.79,
    priority: 'high'
  }
];

// Mock data for strategic insights
interface StrategicInsight {
  id: string;
  title: string;
  description: string;
  confidenceScore: number;
  dataPoints: number;
  category: 'academic' | 'financial' | 'operational' | 'strategic';
  recommendedActions: string[];
}

const mockStrategicInsights: StrategicInsight[] = [
  {
    id: 'insight-1',
    title: 'Declining Enrollment in Humanities Programs',
    description: 'Analysis indicates a 15% decline in humanities program enrollments over the past 3 years, with particularly sharp drops in traditional literature and history courses. This trend is projected to continue unless intervention strategies are implemented.',
    confidenceScore: 0.92,
    dataPoints: 1250,
    category: 'academic',
    recommendedActions: [
      'Develop interdisciplinary programs connecting humanities with high-growth fields',
      'Modernize curriculum to emphasize digital humanities and practical applications',
      'Create career pathway programs demonstrating humanities degree value'
    ]
  },
  {
    id: 'insight-2',
    title: 'Resource Optimization Opportunity',
    description: 'Current classroom utilization analysis shows 40% of large lecture halls are underutilized during afternoon hours, while smaller classrooms are overbooked. Redistributing courses could increase overall space efficiency by 28%.',
    confidenceScore: 0.85,
    dataPoints: 850,
    category: 'operational',
    recommendedActions: [
      'Implement dynamic room scheduling system based on enrollment patterns',
      'Offer incentives for departments to schedule courses in underutilized time slots',
      'Convert selected underutilized large spaces to flexible learning environments'
    ]
  },
  {
    id: 'insight-3',
    title: 'High-Impact Research Investment Areas',
    description: 'Trend analysis of research outcomes, citations, and grant success rates identifies three emerging fields with high potential for institutional leadership: quantum computing, sustainable materials engineering, and AI ethics.',
    confidenceScore: 0.78,
    dataPoints: 2100,
    category: 'strategic',
    recommendedActions: [
      'Allocate $1.2M in seed funding across the three identified research areas',
      'Create cross-disciplinary research clusters around these themes',
      'Develop faculty recruitment strategy targeting experts in these domains'
    ]
  }
];

const AdminAIPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('year');
  const [metricCategory, setMetricCategory] = useState('all');
  const [performanceMetrics, setPerformanceMetrics] = useState(mockPerformanceMetrics);
  const [resourceAllocations] = useState(mockResourceAllocations);
  const [strategicInsights] = useState(mockStrategicInsights);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle date range change
  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setDateRange(event.target.value);
  };

  // Handle metric category change
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const category = event.target.value;
    setMetricCategory(category);
    
    if (category === 'all') {
      setPerformanceMetrics(mockPerformanceMetrics);
    } else {
      setPerformanceMetrics(mockPerformanceMetrics.filter(
        metric => metric.category.toLowerCase() === category.toLowerCase()
      ));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In production, this would call the actual APIs
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Data is already set with mock values
      } catch (err) {
        console.error('Error loading admin AI data:', err);
        setError(t('ai.errors.loadFailed', 'Failed to load AI data. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [t]);

  // Format number for display
  const formatNumber = (value: number, unit: string) => {
    if (unit === 'ratio') {
      return `1:${Math.round(1/value)}`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'GPA') {
      return value.toFixed(2);
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Calculate percent change
  const calculatePercentChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  // Render institutional metrics section
  const renderInstitutionalMetrics = () => {
    return (
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('ai.admin.institutionalMetrics', 'Institutional Performance Metrics')}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="metric-category-label">{t('ai.admin.category', 'Category')}</InputLabel>
                <Select
                  labelId="metric-category-label"
                  id="metric-category"
                  value={metricCategory}
                  onChange={handleCategoryChange}
                  label={t('ai.admin.category', 'Category')}
                >
                  <MenuItem value="all">{t('ai.admin.allCategories', 'All Categories')}</MenuItem>
                  <MenuItem value="academic">{t('ai.admin.academic', 'Academic')}</MenuItem>
                  <MenuItem value="engagement">{t('ai.admin.engagement', 'Engagement')}</MenuItem>
                  <MenuItem value="resources">{t('ai.admin.resources', 'Resources')}</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="date-range-label">{t('ai.admin.dateRange', 'Date Range')}</InputLabel>
                <Select
                  labelId="date-range-label"
                  id="date-range"
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  label={t('ai.admin.dateRange', 'Date Range')}
                >
                  <MenuItem value="quarter">{t('ai.admin.quarter', 'Quarter')}</MenuItem>
                  <MenuItem value="semester">{t('ai.admin.semester', 'Semester')}</MenuItem>
                  <MenuItem value="year">{t('ai.admin.year', 'Year')}</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('ai.admin.metric', 'Metric')}</TableCell>
                  <TableCell>{t('ai.admin.category', 'Category')}</TableCell>
                  <TableCell align="right">{t('ai.admin.current', 'Current')}</TableCell>
                  <TableCell align="right">{t('ai.admin.previous', 'Previous')}</TableCell>
                  <TableCell align="right">{t('ai.admin.change', 'Change')}</TableCell>
                  <TableCell align="right">{t('ai.admin.goal', 'Goal')}</TableCell>
                  <TableCell align="right">{t('ai.admin.progress', 'Progress')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performanceMetrics.map((metric) => {
                  const percentChange = calculatePercentChange(metric.currentValue, metric.previousValue);
                  const progressToGoal = metric.goalValue 
                    ? (metric.currentValue / metric.goalValue) * 100 
                    : 100;
                    
                  return (
                    <TableRow key={metric.id}>
                      <TableCell component="th" scope="row">
                        {metric.name}
                      </TableCell>
                      <TableCell>{metric.category}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatNumber(metric.currentValue, metric.unit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(metric.previousValue, metric.unit)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          label={`${percentChange.startsWith('-') ? '' : '+'}${percentChange}%`}
                          color={
                            metric.trend === 'up' 
                              ? (Number(percentChange) > 0 ? 'success' : 'error') 
                              : (Number(percentChange) < 0 ? 'success' : 'error')
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {metric.goalValue ? formatNumber(metric.goalValue, metric.unit) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Box sx={{ width: 100, mr: 1 }}>
                            <Box
                              sx={{
                                height: 5,
                                width: '100%',
                                backgroundColor: theme.palette.grey[300],
                                borderRadius: 5,
                              }}
                            >
                              <Box
                                sx={{
                                  height: 5,
                                  width: `${Math.min(progressToGoal, 100)}%`,
                                  backgroundColor: 
                                    progressToGoal >= 95 ? theme.palette.success.main :
                                    progressToGoal >= 70 ? theme.palette.primary.main :
                                    theme.palette.warning.main,
                                  borderRadius: 5,
                                }}
                              />
                            </Box>
                          </Box>
                          <Typography variant="caption">
                            {Math.round(progressToGoal)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button startIcon={<DownloadIcon />} size="small" variant="outlined">
              {t('ai.admin.exportMetrics', 'Export Metrics')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render resource allocation section
  const renderResourceAllocation = () => {
    return (
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('ai.admin.resourceAllocation', 'AI-Optimized Resource Allocation')}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                startIcon={<DownloadIcon />}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                {t('ai.admin.downloadReport', 'Download Report')}
              </Button>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('ai.admin.resourceAllocationInfo', 'AI analysis suggests optimizing resource allocations across departments to achieve better overall institutional outcomes. Below are the recommendations based on enrollment trends, program performance, and strategic goals.')}
          </Alert>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('ai.admin.department', 'Department')}</TableCell>
                  <TableCell align="right">{t('ai.admin.currentAllocation', 'Current Allocation')}</TableCell>
                  <TableCell align="right">{t('ai.admin.recommendedAllocation', 'Recommended Allocation')}</TableCell>
                  <TableCell align="right">{t('ai.admin.difference', 'Difference')}</TableCell>
                  <TableCell>{t('ai.admin.justification', 'Justification')}</TableCell>
                  <TableCell align="center">{t('ai.admin.priority', 'Priority')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resourceAllocations.map((allocation) => {
                  const difference = allocation.optimalAllocation - allocation.currentAllocation;
                  return (
                    <TableRow key={allocation.departmentId}>
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" fontWeight="medium">
                          {allocation.departmentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {allocation.departmentId}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(allocation.currentAllocation, '')}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(allocation.optimalAllocation, '')}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2"
                          color={
                            difference > 0 ? 'success.main' : 
                            difference < 0 ? 'error.main' : 'text.primary'
                          }
                          fontWeight="medium"
                        >
                          {difference > 0 ? '+' : ''}{formatNumber(difference, '')}
                          <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                            ({Math.round((difference / allocation.currentAllocation) * 100)}%)
                          </Typography>
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.justification}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={t(`ai.common.priority.${allocation.priority}`, allocation.priority)}
                          color={
                            allocation.priority === 'high' ? 'error' :
                            allocation.priority === 'medium' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('ai.admin.allocationVisualization', 'Resource Allocation Visualization')}
            </Typography>
            <AnalyticsChart chartType="resources" height={350} />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained">
              {t('ai.admin.applyRecommendations', 'Apply Recommendations')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render strategic insights section
  const renderStrategicInsights = () => {
    return (
      <Grid container spacing={3}>
        {strategicInsights.map((insight) => (
          <Grid item xs={12} key={insight.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">{insight.title}</Typography>
                    <Chip
                      size="small"
                      label={t(`ai.admin.category.${insight.category}`, insight.category)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={t('ai.admin.confidenceLevel', 'Confidence Level')}>
                      <Chip
                        size="small"
                        label={`${Math.round(insight.confidenceScore * 100)}% ${t('ai.admin.confidence', 'Confidence')}`}
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    </Tooltip>
                    
                    <IconButton size="small">
                      <MoreIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {insight.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  {t('ai.admin.recommendedActions', 'Recommended Actions')}:
                </Typography>
                
                <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                  {insight.recommendedActions.map((action, idx) => (
                    <Typography component="li" variant="body2" key={idx} gutterBottom>
                      {action}
                    </Typography>
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button variant="text" size="small" sx={{ mr: 1 }}>
                    {t('ai.admin.deepDive', 'Deep Dive Analysis')}
                  </Button>
                  <Button variant="outlined" size="small">
                    {t('ai.admin.implementRecommendations', 'Implement Recommendations')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('ai.admin.title', 'Administrative AI Dashboard')}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {t('ai.admin.description', 'AI-powered analytics and insights to optimize institutional performance and resource allocation.')}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Admin AI dashboard tabs">
          <Tab label={t('ai.admin.tabs.metrics', 'Metrics')} icon={<AnalyticsIcon />} iconPosition="start" />
          <Tab label={t('ai.admin.tabs.resources', 'Resources')} icon={<InstitutionIcon />} iconPosition="start" />
          <Tab label={t('ai.admin.tabs.insights', 'Insights')} icon={<TrendingIcon />} iconPosition="start" />
          <Tab label={t('ai.admin.tabs.planning', 'Planning')} icon={<SchoolIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            {renderInstitutionalMetrics()}
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('ai.admin.trendAnalysis', 'Institutional Trend Analysis')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('ai.admin.trendAnalysisDescription', 'Comparison of key institutional metrics over time showing growth trends and areas for improvement.')}
              </Typography>
              <Box sx={{ height: 350 }}>
                <AnalyticsChart chartType="performance" height={350} />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                <Button startIcon={<PrintIcon />} size="small">
                  {t('ai.admin.print', 'Print')}
                </Button>
                <Button startIcon={<ExportIcon />} size="small">
                  {t('ai.admin.export', 'Export')}
                </Button>
              </Box>
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {renderResourceAllocation()}
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('ai.admin.capacityPlanning', 'Capacity Planning')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('ai.admin.capacityPlanningDescription', 'AI-projected capacity needs based on enrollment trends and strategic growth targets.')}
              </Typography>
              
              <Box sx={{ height: 350 }}>
                <AnalyticsChart chartType="enrollment" height={350} />
              </Box>
              
              <Alert severity="warning" sx={{ mt: 3 }}>
                {t('ai.admin.capacityWarning', 'Current facility capacity projected to reach 95% utilization by next Fall semester. Consider expansion planning.')}
              </Alert>
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('ai.admin.aiInsights', 'AI-Generated Strategic Insights')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('ai.admin.aiInsightsDescription', 'Data-driven insights and recommendations generated through advanced analytics and machine learning algorithms.')}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {renderStrategicInsights()}
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('ai.admin.strategicPlanning', 'Strategic Planning Assistant')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('ai.admin.strategicPlanningDescription', 'AI-powered tools to assist in developing comprehensive 5-year strategic plans aligned with institutional goals.')}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                {t('ai.admin.planningComingSoon', 'Strategic Planning Assistant features coming soon. Early access available for select partners.')}
              </Alert>
              
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SchoolIcon sx={{ fontSize: 100, opacity: 0.3 }} />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button variant="outlined">
                  {t('ai.admin.contactForDemo', 'Contact Us for Early Demo')}
                </Button>
              </Box>
            </Paper>
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default AdminAIPage;