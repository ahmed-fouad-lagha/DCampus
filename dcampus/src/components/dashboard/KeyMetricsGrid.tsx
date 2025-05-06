import React, { useMemo, useCallback } from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  LibraryBooks as LibraryBooksIcon,
  Event as EventIcon,
  EmojiEvents as AchievementIcon
} from '@mui/icons-material';

interface MetricProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
  secondaryText?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

interface KeyMetricsGridProps {
  userRole: 'student' | 'faculty' | 'admin';
  onMetricClick?: (metricName: string) => void;
}

// Memoized metric card component to prevent unnecessary re-renders
const MetricCard = React.memo<MetricProps>(({ 
  icon, 
  title, 
  value, 
  color, 
  secondaryText, 
  change,
  onClick 
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3
        } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box 
          sx={{ 
            bgcolor: `${color}15`, 
            color: color, 
            p: 1, 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
        
        {change && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: change.isPositive ? 'success.main' : 'error.main',
              fontSize: '0.875rem'
            }}
          >
            {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
          </Box>
        )}
      </Box>
      
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
        {value}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      
      {secondaryText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
          {secondaryText}
        </Typography>
      )}
    </Paper>
  );
});

// Add display name for better debugging
MetricCard.displayName = 'MetricCard';

const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ userRole, onMetricClick }) => {
  const { t } = useTranslation();
  
  // Define metrics based on user role using useMemo to prevent recalculation on every render
  const metrics = useMemo(() => {
    switch (userRole) {
      case 'student':
        return [
          {
            id: 'gpa',
            icon: <SchoolIcon />,
            title: t('metrics.student.currentGPA'),
            value: '3.7',
            color: '#1976d2', // blue
            secondaryText: 'Last semester: 3.5',
            change: { value: 5, isPositive: true }
          },
          {
            id: 'assignments',
            icon: <AssignmentIcon />,
            title: t('metrics.student.assignmentsDue'),
            value: '8',
            color: '#e53935', // red
            secondaryText: '3 due this week'
          },
          {
            id: 'courses',
            icon: <LibraryBooksIcon />,
            title: t('metrics.student.activeCourses'),
            value: '5',
            color: '#43a047', // green
          },
          {
            id: 'events',
            icon: <EventIcon />,
            title: t('metrics.student.upcomingEvents'),
            value: '3',
            color: '#ff9800', // orange
            secondaryText: 'Next: AI Research Symposium'
          }
        ];
      
      case 'faculty':
        return [
          {
            id: 'courses',
            icon: <SchoolIcon />,
            title: t('metrics.faculty.coursesTeaching'),
            value: '4',
            color: '#1976d2', // blue
          },
          {
            id: 'assignments',
            icon: <AssignmentIcon />,
            title: t('metrics.faculty.assignmentsToGrade'),
            value: '23',
            color: '#e53935', // red
            secondaryText: '8 submissions today'
          },
          {
            id: 'students',
            icon: <GroupIcon />,
            title: t('metrics.faculty.totalStudents'),
            value: '127',
            color: '#43a047', // green
          },
          {
            id: 'events',
            icon: <EventIcon />,
            title: t('metrics.faculty.upcomingEvents'),
            value: '2',
            color: '#ff9800', // orange
            secondaryText: 'Next: Faculty meeting'
          }
        ];
      
      case 'admin':
        return [
          {
            id: 'users',
            icon: <GroupIcon />,
            title: t('metrics.administrator.activeUsers'),
            value: '3,254',
            color: '#1976d2', // blue
            change: { value: 12, isPositive: true }
          },
          {
            id: 'courses',
            icon: <LibraryBooksIcon />,
            title: t('metrics.administrator.activeCourses'),
            value: '187',
            color: '#9c27b0', // purple
            secondaryText: '15 new this semester'
          },
          {
            id: 'resources',
            icon: <TrendingUpIcon />,
            title: t('metrics.administrator.resourcesUsed'),
            value: '86%',
            color: '#43a047', // green
            change: { value: 4, isPositive: true }
          },
          {
            id: 'events',
            icon: <EventIcon />,
            title: t('metrics.administrator.upcomingEvents'),
            value: '8',
            color: '#ff9800', // orange
            secondaryText: 'Next: Orientation Day'
          }
        ];
        
      default:
        return [];
    }
  }, [userRole, t]); // Only recalculate when userRole or translations change
  
  // Memoize the click handler to prevent recreation on every render
  const handleMetricClick = useCallback((metricId: string) => {
    if (onMetricClick) {
      onMetricClick(metricId);
    }
  }, [onMetricClick]);
  
  return (
    <Stack 
      direction="row" 
      flexWrap="wrap" 
      spacing={3} 
      useFlexGap
      sx={{ 
        '& > *': { 
          flexGrow: 1,
          width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } 
        } 
      }}
    >
      {metrics.map((metric) => (
        <Box key={metric.id} sx={{ minWidth: 200 }}>
          <MetricCard 
            {...metric} 
            onClick={onMetricClick ? () => handleMetricClick(metric.id) : undefined}
          />
        </Box>
      ))}
    </Stack>
  );
};

// Wrap the component with memo for better performance
export default React.memo(KeyMetricsGrid);