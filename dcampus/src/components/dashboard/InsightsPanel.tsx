import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, LinearProgress, Button } from '@mui/material';
import { Lightbulb as LightbulbIcon, TrendingUp as TrendingUpIcon, School as SchoolIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface InsightsPanelProps {
  onInsightClick?: (insightId: number) => void;
}

// Mock data for insights
const insightsMockData = [
  {
    id: 1,
    content: 'Your performance in Data Structures is 15% better than last semester. Keep up the good work!',
    type: 'performance',
    relevanceScore: 95,
  },
  {
    id: 2,
    content: 'Consider allocating more time for the Machine Learning course based on upcoming assignment difficulty.',
    type: 'recommendation',
    relevanceScore: 88,
  },
  {
    id: 3,
    content: 'There are 2 open study groups for the Database Systems course that match your learning preferences.',
    type: 'opportunity',
    relevanceScore: 82,
  },
];

const InsightsPanel: React.FC<InsightsPanelProps> = ({ onInsightClick }) => {
  const { t } = useTranslation();
  
  // Get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUpIcon color="success" />;
      case 'recommendation':
        return <LightbulbIcon color="warning" />;
      case 'opportunity':
        return <SchoolIcon color="info" />;
      default:
        return <LightbulbIcon />;
    }
  };
  
  // Handle insight click
  const handleInsightClick = (insightId: number) => {
    if (onInsightClick) {
      onInsightClick(insightId);
    }
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flexGrow: 1, overflow: 'auto', mb: 1 }}>
        {insightsMockData.map((insight) => (
          <ListItem 
            key={insight.id} 
            alignItems="flex-start" 
            sx={{ 
              mb: 1, 
              bgcolor: 'background.paper', 
              borderRadius: 1, 
              boxShadow: 1,
              cursor: onInsightClick ? 'pointer' : 'default',
              '&:hover': onInsightClick ? { 
                bgcolor: 'action.hover' 
              } : {}
            }}
            onClick={() => handleInsightClick(insight.id)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getInsightIcon(insight.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" component="div" sx={{ fontWeight: 'medium' }}>
                  {insight.content}
                </Typography>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={insight.relevanceScore}
                    sx={{ 
                      flexGrow: 1, 
                      height: 6, 
                      borderRadius: 3,
                      mr: 2
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {insight.relevanceScore}{t('insights.relevantScore')}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
      <Button
        variant="text"
        color="primary"
        fullWidth
        sx={{ mt: 'auto' }}
      >
        {t('insights.viewAll')}
      </Button>
    </Box>
  );
};

export default InsightsPanel;