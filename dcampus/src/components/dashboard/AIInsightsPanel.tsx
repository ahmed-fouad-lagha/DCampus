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
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Import AI services
import PredictiveService from '../../services/predictiveService';
import RecommendationService from '../../services/recommendationService';

interface AIInsightsPanelProps {
  userId: string;
  userRole: 'student' | 'faculty' | 'admin';
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ userId, userRole }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const theme = useTheme();
  const { t } = useTranslation();

  // Initialize AI services
  const predictiveService = new PredictiveService();
  const recommendationService = new RecommendationService();

  // Fetch AI insights data
  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch different insights based on user role
      let insightsData;
      
      if (userRole === 'student') {
        const prediction = await predictiveService.predictStudentPerformance({ 
          studentId: userId 
        });
        const courses = await recommendationService.getRecommendedCourses({
          userId,
          userRole,
          limit: 2
        });
        
        insightsData = [
          {
            type: 'prediction',
            title: 'Academic Performance Prediction',
            content: `You're projected to achieve ${prediction.predictedGrade}% overall grade with ${Math.round(prediction.confidenceScore * 100)}% confidence.`,
            priority: prediction.riskLevel === 'high' ? 'high' : 
                    prediction.riskLevel === 'medium' ? 'medium' : 'low'
          },
          {
            type: 'recommendation',
            title: 'Course Recommendations',
            content: `Based on your profile, consider taking ${courses[0]?.courseName || 'recommended courses'} to enhance your skills.`,
            priority: 'medium'
          }
        ];
      } else if (userRole === 'faculty') {
        const atRiskStudents = await predictiveService.identifyAtRiskStudents('CURRENT_COURSE');
        
        insightsData = [
          {
            type: 'alert',
            title: 'At-Risk Students',
            content: `${atRiskStudents.length} students in your current course may require additional support.`,
            priority: atRiskStudents.length > 3 ? 'high' : 'medium'
          }
        ];
      } else {
        // Admin insights
        const enrollment = await predictiveService.predictCourseEnrollment(
          'SAMPLE_COURSE', 
          '2025-2026', 
          'Fall'
        );
        
        insightsData = [
          {
            type: 'trend',
            title: 'Enrollment Prediction',
            content: `Expected ${enrollment.predictedEnrollment} students for Fall 2025, a ${Math.abs(Math.round(enrollment.changeFromPrevious))}% ${enrollment.changeFromPrevious >= 0 ? 'increase' : 'decrease'} from previous semester.`,
            priority: enrollment.changeFromPrevious < -10 ? 'high' : 'medium'
          }
        ];
      }
      
      setInsights(insightsData);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Failed to load AI insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load insights when component mounts
  useEffect(() => {
    fetchInsights();
  }, [userId, userRole]);

  // Display priority indicator chip
  const renderPriorityChip = (priority: 'high' | 'medium' | 'low') => {
    const color = priority === 'high' 
      ? theme.palette.error.main 
      : priority === 'medium' 
        ? theme.palette.warning.main 
        : theme.palette.success.main;
    
    const label = priority === 'high' 
      ? 'Important' 
      : priority === 'medium' 
        ? 'Notice' 
        : 'Info';
    
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
            <InsightsIcon sx={{ mr: 1 }} color="primary" />
            AI Insights
          </Typography>
          
          <Tooltip title="Refresh insights">
            <IconButton onClick={fetchInsights} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {loading ? (
          <LinearProgress sx={{ my: 4 }} />
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : insights.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>No AI insights available at this time.</Alert>
        ) : (
          <List sx={{ p: 0 }}>
            {insights.map((insight, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <AIIcon color="primary" />
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
          disabled={loading}
        >
          View Detailed Insights
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIInsightsPanel;