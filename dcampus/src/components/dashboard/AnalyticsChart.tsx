import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import PredictiveService from '../../services/predictiveService';
import RecommendationService from '../../services/recommendationService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

interface AnalyticsChartProps {
  chartType?: 'performance' | 'attendance' | 'engagement' | 'enrollment' | 'resources';
  title?: string;
  height?: number | string;
}

type TimeRange = '7days' | '30days' | '90days' | 'semester' | 'year';

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  chartType = 'performance',
  title,
  height = 300
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('semester');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  
  // Initialize services
  const predictiveService = new PredictiveService();
  const recommendationService = new RecommendationService();
  
  // Define colors based on theme
  const chartColors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    text: theme.palette.text.secondary,
    background: theme.palette.background.paper,
    grid: theme.palette.divider
  };
  
  // Load chart data based on chart type and time range
  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data;
        
        switch (chartType) {
          case 'performance':
            data = await fetchPerformanceData(timeRange);
            break;
          case 'attendance':
            data = await fetchAttendanceData(timeRange);
            break;
          case 'engagement':
            data = await fetchEngagementData(timeRange);
            break;
          case 'enrollment':
            data = await fetchEnrollmentData(timeRange);
            break;
          case 'resources':
            data = await fetchResourcesData(timeRange);
            break;
          default:
            data = await fetchPerformanceData(timeRange);
        }
        
        setChartData(data);
      } catch (err) {
        console.error(`Error loading ${chartType} chart data:`, err);
        setError(t('analytics.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    loadChartData();
  }, [chartType, timeRange]);
  
  // Generate mock performance data (grades over time)
  const fetchPerformanceData = async (range: TimeRange) => {
    // In a real app, this would call an API endpoint
    // For now, we'll generate mock data
    
    // Generate appropriate labels based on time range
    const labels = generateTimeLabels(range);
    
    // Current student's performance
    const studentData = labels.map((_, i) => {
      // Start lower, gradually improve with some fluctuation
      return 65 + (i * 1.5) + (Math.random() * 8 - 4);
    });
    
    // Class average for comparison
    const classAvgData = labels.map((_, i) => {
      // Relatively stable with slight upward trend
      return 72 + (i * 0.5) + (Math.random() * 5 - 2.5);
    });
    
    // Get a performance prediction for the future
    const prediction = await predictiveService.getMockPerformanceData(profile?.user_id || '');
    
    // Add prediction point at the end if prediction was successful
    let predictedPoint = null;
    if (prediction.success && prediction.data) {
      predictedPoint = prediction.data.predictedGrade;
    }
    
    // Format the chart data
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t('analytics.performance.yourPerformance'),
            data: studentData,
            borderColor: chartColors.primary,
            backgroundColor: `${chartColors.primary}33`,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: t('analytics.performance.classAverage'),
            data: classAvgData,
            borderColor: chartColors.secondary,
            backgroundColor: `${chartColors.secondary}33`,
            fill: false,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderDash: [5, 5]
          },
          ...(predictedPoint ? [{
            label: t('analytics.performance.prediction'),
            data: [...Array(labels.length - 1).fill(null), predictedPoint],
            borderColor: chartColors.success,
            backgroundColor: chartColors.success,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointStyle: 'star'
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += Math.round(context.parsed.y * 10) / 10 + '%';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: t('analytics.performance.grade')
            },
            ticks: {
              callback: function(value: any) {
                return value + '%';
              }
            },
            grid: {
              color: chartColors.grid
            }
          },
          x: {
            title: {
              display: true,
              text: getTimeRangeLabel(range)
            },
            grid: {
              color: chartColors.grid
            }
          }
        }
      }
    };
  };
  
  // Generate mock attendance data
  const fetchAttendanceData = async (range: TimeRange) => {
    const labels = generateTimeLabels(range);
    
    // Student attendance (percentage of classes attended)
    const attendanceData = labels.map(() => {
      // Generate random attendance between 70% and 100%
      return Math.round((Math.random() * 30) + 70);
    });
    
    // Class average attendance
    const classAvgData = labels.map(() => {
      // Generate random class average between 75% and 90%
      return Math.round((Math.random() * 15) + 75);
    });
    
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: t('analytics.attendance.yourAttendance'),
            data: attendanceData,
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primary,
            borderWidth: 1
          },
          {
            label: t('analytics.attendance.classAverage'),
            data: classAvgData,
            backgroundColor: chartColors.secondary,
            borderColor: chartColors.secondary,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + '%';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: t('analytics.attendance.attendanceRate')
            },
            ticks: {
              callback: function(value: any) {
                return value + '%';
              }
            },
            grid: {
              color: chartColors.grid
            }
          },
          x: {
            title: {
              display: true,
              text: getTimeRangeLabel(range)
            },
            grid: {
              color: chartColors.grid
            }
          }
        }
      }
    };
  };
  
  // Generate mock engagement data
  const fetchEngagementData = async (range: TimeRange) => {
    // For engagement, we'll use a doughnut chart showing various engagement metrics
    
    return {
      type: 'doughnut',
      data: {
        labels: [
          t('analytics.engagement.discussions'),
          t('analytics.engagement.assignments'),
          t('analytics.engagement.resources'),
          t('analytics.engagement.quizzes'),
          t('analytics.engagement.projects')
        ],
        datasets: [
          {
            data: [
              Math.round(Math.random() * 40) + 60, // Discussions engagement
              Math.round(Math.random() * 40) + 60, // Assignments completion
              Math.round(Math.random() * 40) + 60, // Resources accessed
              Math.round(Math.random() * 40) + 60, // Quizzes taken
              Math.round(Math.random() * 40) + 60  // Projects participation
            ],
            backgroundColor: [
              chartColors.primary,
              chartColors.secondary,
              chartColors.success,
              chartColors.warning,
              chartColors.info
            ],
            borderColor: theme.palette.background.paper,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    };
  };
  
  // Generate mock enrollment data
  const fetchEnrollmentData = async (range: TimeRange) => {
    // This chart would typically be for admins/faculty
    const labels = generateTimeLabels(range, true);
    
    // Total enrollment numbers
    const enrollmentData = labels.map((_, i) => {
      // Base enrollment with growth trend and seasonal variation
      const baseValue = 2000 + (i * 50);
      const seasonalFactor = (i % 3 === 0) ? 1.1 : (i % 3 === 1) ? 0.9 : 1.0; // Higher in first semester
      return Math.round(baseValue * seasonalFactor + (Math.random() * 100 - 50));
    });
    
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t('analytics.enrollment.total'),
            data: enrollmentData,
            borderColor: chartColors.primary,
            backgroundColor: `${chartColors.primary}33`,
            fill: true,
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: t('analytics.enrollment.students')
            },
            grid: {
              color: chartColors.grid
            }
          },
          x: {
            title: {
              display: true,
              text: getTimeRangeLabel(range, true)
            },
            grid: {
              color: chartColors.grid
            }
          }
        }
      }
    };
  };
  
  // Generate mock resources usage data
  const fetchResourcesData = async (range: TimeRange) => {
    const resourceCategories = [
      t('analytics.resources.videos'),
      t('analytics.resources.readings'),
      t('analytics.resources.practice'),
      t('analytics.resources.discussions'),
      t('analytics.resources.assessments')
    ];
    
    // Your usage
    const yourUsageData = resourceCategories.map(() => Math.round(Math.random() * 15) + 3);
    
    // Peer average usage
    const peerUsageData = resourceCategories.map(() => Math.round(Math.random() * 10) + 5);
    
    return {
      type: 'bar',
      data: {
        labels: resourceCategories,
        datasets: [
          {
            label: t('analytics.resources.yourUsage'),
            data: yourUsageData,
            backgroundColor: chartColors.primary,
            borderColor: chartColors.primary,
            borderWidth: 1
          },
          {
            label: t('analytics.resources.peerAverage'),
            data: peerUsageData,
            backgroundColor: chartColors.secondary,
            borderColor: chartColors.secondary,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: t('analytics.resources.hoursSpent')
            },
            grid: {
              color: chartColors.grid
            }
          },
          x: {
            grid: {
              color: chartColors.grid
            }
          }
        }
      }
    };
  };
  
  // Helper function to generate time labels based on range
  const generateTimeLabels = (range: TimeRange, isEnrollment = false): string[] => {
    switch (range) {
      case '7days':
        // Last 7 days
        return Array(7).fill(0).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toLocaleDateString(undefined, { weekday: 'short' });
        });
      case '30days':
        // Last 30 days in weekly chunks
        return Array(5).fill(0).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - 28 + (i * 7));
          return `Week ${i + 1}`;
        });
      case '90days':
        // Last 90 days in monthly chunks
        return Array(3).fill(0).map((_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - 2 + i);
          return date.toLocaleDateString(undefined, { month: 'short' });
        });
      case 'semester':
        // Current semester by weeks or months
        if (isEnrollment) {
          // For enrollment, show semesters
          return ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025', 'Spring 2026'];
        } else {
          // For other charts, show weeks in a semester
          return ['Week 1', 'Week 3', 'Week 5', 'Week 7', 'Week 9', 'Week 11', 'Week 13', 'Week 15'];
        }
      case 'year':
        // Last year by months or semesters
        if (isEnrollment) {
          // For enrollment, show years
          return ['2022', '2023', '2024', '2025'];
        } else {
          // For other charts, show months
          return Array(12).fill(0).map((_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - 11 + i);
            return date.toLocaleDateString(undefined, { month: 'short' });
          });
        }
      default:
        return ['Week 1', 'Week 3', 'Week 5', 'Week 7', 'Week 9', 'Week 11', 'Week 13', 'Week 15'];
    }
  };
  
  // Helper to get appropriate label for time range
  const getTimeRangeLabel = (range: TimeRange, isEnrollment = false): string => {
    switch (range) {
      case '7days':
        return t('analytics.timeRanges.lastSevenDays');
      case '30days':
        return t('analytics.timeRanges.lastThirtyDays');
      case '90days':
        return t('analytics.timeRanges.lastNinetyDays');
      case 'semester':
        return isEnrollment ? t('analytics.timeRanges.bySemester') : t('analytics.timeRanges.currentSemester');
      case 'year':
        return isEnrollment ? t('analytics.timeRanges.byYear') : t('analytics.timeRanges.lastYear');
      default:
        return t('analytics.timeRanges.timeframe');
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value as TimeRange);
  };
  
  // Handle menu click
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle download chart
  const handleDownload = () => {
    // Close menu
    handleMenuClose();
    
    // In a real app, this would trigger a chart download
    alert(t('analytics.downloadStarted'));
  };
  
  // Generate chart title if not provided
  const getChartTitle = () => {
    if (title) return title;
    
    switch (chartType) {
      case 'performance':
        return t('analytics.titles.performance');
      case 'attendance':
        return t('analytics.titles.attendance');
      case 'engagement':
        return t('analytics.titles.engagement');
      case 'enrollment':
        return t('analytics.titles.enrollment');
      case 'resources':
        return t('analytics.titles.resources');
      default:
        return t('analytics.titles.analytics');
    }
  };
  
  // Render the appropriate chart
  const renderChart = () => {
    if (loading) {
      return <Skeleton variant="rectangular" height={height} animation="wave" />;
    }
    
    if (error || !chartData) {
      return (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography color="text.secondary">{error || t('analytics.errors.noData')}</Typography>
        </Box>
      );
    }
    
    switch (chartData.type) {
      case 'line':
        return <Line data={chartData.data} options={chartData.options} height={height} />;
      case 'bar':
        return <Bar data={chartData.data} options={chartData.options} height={height} />;
      case 'doughnut':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Box sx={{ width: Math.min(Number(height), 400), height: Math.min(Number(height), 400) }}>
              <Doughnut data={chartData.data} options={chartData.options} />
            </Box>
          </Box>
        );
      default:
        return <Line data={chartData.data} options={chartData.options} height={height} />;
    }
  };
  
  // Should we show the time range selector?
  const showTimeRangeSelector = chartType !== 'engagement';
  
  return (
    <Card>
      <CardHeader
        title={getChartTitle()}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showTimeRangeSelector && (
              <FormControl size="small" variant="outlined" sx={{ minWidth: 120, mr: 1 }}>
                <InputLabel id="time-range-select-label">{t('analytics.timeRanges.period')}</InputLabel>
                <Select
                  labelId="time-range-select-label"
                  id="time-range-select"
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label={t('analytics.timeRanges.period')}
                >
                  <MenuItem value="7days">{t('analytics.timeRanges.sevenDays')}</MenuItem>
                  <MenuItem value="30days">{t('analytics.timeRanges.thirtyDays')}</MenuItem>
                  <MenuItem value="90days">{t('analytics.timeRanges.ninetyDays')}</MenuItem>
                  <MenuItem value="semester">{t('analytics.timeRanges.semester')}</MenuItem>
                  <MenuItem value="year">{t('analytics.timeRanges.year')}</MenuItem>
                </Select>
              </FormControl>
            )}
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleDownload}>
                <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                {t('analytics.actions.download')}
              </MenuItem>
            </Menu>
          </Box>
        }
      />
      <CardContent sx={{ pt: 0, pb: 2, height: typeof height === 'number' ? height + 16 : height }}>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default AnalyticsChart;