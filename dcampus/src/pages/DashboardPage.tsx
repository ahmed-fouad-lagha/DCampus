import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Tab, Tabs, 
  useMediaQuery, Grid as MuiGrid, Card, CardContent, 
  Avatar, Divider, IconButton
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import useAnalytics from '../hooks/useAnalytics';
import {
  School as SchoolIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// Import dashboard components
import KeyMetricsGrid from '../components/dashboard/KeyMetricsGrid';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import InsightsPanel from '../components/dashboard/InsightsPanel';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import UpcomingEventsList from '../components/dashboard/UpcomingEventsList';

// Mock user data
const mockUser = {
  id: '1',
  name: 'Mohammed Amine',
  role: 'student' as const,
  department: 'Computer Science',
  institution: 'University of Khenchela'
};

// Styled components
interface GradientCardProps {
  children: React.ReactNode;
  color?: 'primary' | 'secondary';
  sx?: any;
  [key: string]: any;
}

const GradientCard: React.FC<GradientCardProps> = ({ children, color = 'primary', ...rest }) => {
  const theme = useTheme();
  const gradientStart = color === 'primary' ? theme.palette.primary.main : theme.palette.secondary.main;
  const gradientEnd = color === 'primary' ? theme.palette.primary.dark : theme.palette.secondary.dark;
  
  return (
    <Card
      {...rest}
      sx={{
        position: 'relative',
        color: '#fff',
        overflow: 'hidden',
        borderRadius: 3,
        background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        boxShadow: `0 8px 16px -4px ${alpha(gradientStart, 0.2)}`,
        ...(rest.sx || {}),
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 180,
          height: 180,
          transform: 'translate(45%, -45%)',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 120,
          height: 120,
          transform: 'translate(-35%, 35%)',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          zIndex: 0,
        }}
      />
      <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </CardContent>
    </Card>
  );
};

// Custom Grid component to fix TypeScript issues
const Grid = MuiGrid as any;

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // For triggering refresh
  const { trackEvent, trackTiming } = useAnalytics();
  
  // Track page load time
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = Math.round(performance.now() - startTime);
      trackTiming('Dashboard', 'load', loadTime, 'Dashboard Page Load Time');
    };
  }, [trackTiming]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Track which tab users are clicking on
    trackEvent({
      category: 'Dashboard',
      action: 'Tab Changed',
      label: newValue === 0 ? 'Recent Activity' : 'Upcoming Events'
    });
  };

  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
    trackEvent({
      category: 'Dashboard',
      action: 'Refresh Clicked',
      label: 'Dashboard Refresh'
    });
  };
  
  return (
    <Box>
      {/* Welcome Header with Refresh Button */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 4 
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('dashboard.welcome', { name: mockUser.name })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <SchoolIcon fontSize="small" color="primary" />
            <Typography variant="subtitle1" color="text.secondary">
              {mockUser.department}, {mockUser.institution}
            </Typography>
          </Box>
        </Box>
        
        <IconButton 
          aria-label="refresh dashboard" 
          onClick={handleRefresh}
          sx={{ 
            bgcolor: 'background.paper', 
            boxShadow: 1,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {/* Feature Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <GradientCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 'bold', letterSpacing: 1 }}>
                  {t('dashboard.activeCoursesLabel')}
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, mt: 0.5 }}>
                  6
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {t('dashboard.coursesTotalLabel', { count: 8 })}
                </Typography>
              </Box>
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 56,
                  height: 56
                }}
              >
                <SchoolIcon fontSize="large" />
              </Avatar>
            </Box>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon fontSize="small" />
                {t('dashboard.viewAllCourses')}
              </Typography>
            </Box>
          </GradientCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <GradientCard color="secondary">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 'bold', letterSpacing: 1 }}>
                  {t('dashboard.upcomingEventsLabel')}
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, mt: 0.5 }}>
                  3
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {t('dashboard.nearestEventLabel', { date: 'May 10' })}
                </Typography>
              </Box>
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 56,
                  height: 56
                }}
              >
                <TrendingUpIcon fontSize="large" />
              </Avatar>
            </Box>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon fontSize="small" />
                {t('dashboard.viewAllEvents')}
              </Typography>
            </Box>
          </GradientCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3,
              boxShadow: 2,
              backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <CardContent>
              <KeyMetricsGrid userRole={mockUser.role} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Analytics and Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" component="h2">
                  {t('dashboard.analyticsTitle')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Analytics controls could go here */}
                </Box>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <AnalyticsChart 
                key={refreshKey}
                userRole={mockUser.role} 
                onChartInteraction={(chartType) => 
                  trackEvent({
                    category: 'Dashboard',
                    action: 'Chart Interaction',
                    label: chartType
                  })
                }
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" component="h2" sx={{ mb: 2 }}>
                {t('dashboard.insightsTitle')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <InsightsPanel 
                key={refreshKey}
                onInsightClick={(insightId) => 
                  trackEvent({
                    category: 'Dashboard',
                    action: 'Insight Clicked',
                    label: `Insight-${insightId}`
                  })
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Activities and Events (Tabs on Mobile) */}
      {isMobile ? (
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
              aria-label="dashboard tabs"
            >
              <Tab 
                label={t('dashboard.recentActivityTab')} 
                sx={{ 
                  fontWeight: 'medium', 
                  textTransform: 'none',
                  py: 2
                }} 
              />
              <Tab 
                label={t('dashboard.upcomingEventsTab')} 
                sx={{ 
                  fontWeight: 'medium', 
                  textTransform: 'none',
                  py: 2
                }} 
              />
            </Tabs>
          </Box>
          <Box sx={{ p: 3, minHeight: 400 }}>
            {tabValue === 0 && <RecentActivityList 
              key={`activity-${refreshKey}`}
              onActivityClick={(activityId) => 
                trackEvent({
                  category: 'Dashboard',
                  action: 'Activity Clicked',
                  label: `Activity-${activityId}`
                })
              }
            />}
            {tabValue === 1 && <UpcomingEventsList 
              key={`events-${refreshKey}`}
              onEventClick={(eventId) => 
                trackEvent({
                  category: 'Dashboard',
                  action: 'Event Clicked',
                  label: `Event-${eventId}`
                })
              }
            />}
          </Box>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 400, borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" component="h2" sx={{ mb: 2 }}>
                  {t('dashboard.recentActivityTitle')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <RecentActivityList 
                  key={`activity-${refreshKey}`}
                  onActivityClick={(activityId) => 
                    trackEvent({
                      category: 'Dashboard',
                      action: 'Activity Clicked',
                      label: `Activity-${activityId}`
                    })
                  }
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 400, borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" component="h2" sx={{ mb: 2 }}>
                  {t('dashboard.upcomingEventsTitle')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <UpcomingEventsList 
                  key={`events-${refreshKey}`}
                  onEventClick={(eventId) => 
                    trackEvent({
                      category: 'Dashboard',
                      action: 'Event Clicked',
                      label: `Event-${eventId}`
                    })
                  }
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DashboardPage;