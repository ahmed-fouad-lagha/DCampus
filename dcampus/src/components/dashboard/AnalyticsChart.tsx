import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';

interface AnalyticsChartProps {
  userRole: 'student' | 'faculty' | 'admin';
  onChartInteraction?: (chartType: string) => void;
}

type ChartType = 'performance' | 'attendance' | 'activity';
type TimeRange = 'weekly' | 'monthly' | 'yearly';

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ userRole, onChartInteraction }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [chartType, setChartType] = useState<ChartType>('performance');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  
  // Get chart title based on type and user role
  const getChartTitle = (): string => {
    if (userRole === 'student') {
      if (chartType === 'performance') return t('analytics.student.performance');
      if (chartType === 'attendance') return t('analytics.student.attendance');
      return t('analytics.student.activity');
    } else if (userRole === 'faculty') {
      if (chartType === 'performance') return t('analytics.faculty.performance');
      if (chartType === 'attendance') return t('analytics.faculty.attendance');
      return t('analytics.faculty.activity');
    } else {
      if (chartType === 'performance') return t('analytics.admin.performance');
      if (chartType === 'attendance') return t('analytics.admin.attendance');
      return t('analytics.admin.activity');
    }
  };
  
  const handleChartTypeChange = (event: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
    if (newType !== null) {
      setChartType(newType);
      // Call the callback if provided
      if (onChartInteraction) {
        onChartInteraction(newType);
      }
    }
  };

  const handleTimeRangeChange = (event: React.MouseEvent<HTMLElement>, newRange: TimeRange | null) => {
    if (newRange !== null) {
      setTimeRange(newRange);
      // Call the callback if provided
      if (onChartInteraction) {
        onChartInteraction(`range-${newRange}`);
      }
    }
  };
  
  return (
    <Paper 
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {getChartTitle()}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={chartType}
            onChange={handleChartTypeChange}
            aria-label="chart type"
          >
            <ToggleButton value="performance" aria-label="performance">
              {t('analytics.types.performance')}
            </ToggleButton>
            <ToggleButton value="attendance" aria-label="attendance">
              {t('analytics.types.attendance')}
            </ToggleButton>
            <ToggleButton value="activity" aria-label="activity">
              {t('analytics.types.activity')}
            </ToggleButton>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            size="small"
            exclusive
            value={timeRange}
            onChange={handleTimeRangeChange}
            aria-label="time range"
          >
            <ToggleButton value="weekly" aria-label="weekly">
              {t('analytics.range.weekly')}
            </ToggleButton>
            <ToggleButton value="monthly" aria-label="monthly">
              {t('analytics.range.monthly')}
            </ToggleButton>
            <ToggleButton value="yearly" aria-label="yearly">
              {t('analytics.range.yearly')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <Box sx={{ 
        width: '100%', 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 1
      }}>
        <Typography color="text.secondary">
          {t('analytics.chartPlaceholder', { 
            defaultValue: 'Charts will be displayed here once recharts is properly installed'
          })}
        </Typography>
      </Box>
    </Paper>
  );
};

export default AnalyticsChart;