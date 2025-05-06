import React from 'react';
import { 
  Box, List, ListItem, ListItemText, ListItemAvatar, 
  Avatar, Typography, Divider, Button 
} from '@mui/material';
import { 
  Assignment as AssignmentIcon,
  Book as BookIcon,
  Quiz as QuizIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Define activity types
type ActivityType = 'assignment' | 'course' | 'quiz' | 'comment';

interface ActivityItem {
  id: number;
  type: ActivityType;
  title: string;
  course: string;
  timestamp: string;
}

interface RecentActivityListProps {
  onActivityClick?: (activityId: number) => void;
}

// Mock data for recent activities
const activityData: ActivityItem[] = [
  {
    id: 1,
    type: 'assignment',
    title: 'Submitted Assignment: Neural Networks Implementation',
    course: 'CS402 - Advanced Machine Learning',
    timestamp: '2 hours ago'
  },
  {
    id: 2,
    type: 'course',
    title: 'Completed Chapter: Database Normalization',
    course: 'CS305 - Database Systems',
    timestamp: '5 hours ago'
  },
  {
    id: 3,
    type: 'quiz',
    title: 'Completed Quiz: Data Structures',
    course: 'CS201 - Data Structures and Algorithms',
    timestamp: 'Yesterday'
  },
  {
    id: 4,
    type: 'comment',
    title: 'Added discussion comment',
    course: 'CS402 - Advanced Machine Learning',
    timestamp: 'Yesterday'
  },
  {
    id: 5,
    type: 'assignment',
    title: 'Started Assignment: API Design',
    course: 'CS350 - Web Development',
    timestamp: '2 days ago'
  }
];

const RecentActivityList: React.FC<RecentActivityListProps> = ({ onActivityClick }) => {
  const { t } = useTranslation();

  // Get icon based on activity type
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'assignment':
        return <AssignmentIcon />;
      case 'course':
        return <BookIcon />;
      case 'quiz':
        return <QuizIcon />;
      case 'comment':
        return <CommentIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  // Get color based on activity type
  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'assignment':
        return '#1976d2'; // blue
      case 'course':
        return '#43a047'; // green
      case 'quiz':
        return '#e53935'; // red
      case 'comment':
        return '#9c27b0'; // purple
      default:
        return '#757575'; // gray
    }
  };

  // Handle activity click
  const handleActivityClick = (activityId: number) => {
    if (onActivityClick) {
      onActivityClick(activityId);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flexGrow: 1, overflow: 'auto', mb: 1 }}>
        {activityData.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <ListItem 
              alignItems="flex-start" 
              sx={{ 
                py: 1.5,
                cursor: onActivityClick ? 'pointer' : 'default',
                '&:hover': onActivityClick ? { 
                  bgcolor: 'action.hover' 
                } : {}
              }}
              onClick={() => handleActivityClick(activity.id)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}20`, color: getActivityColor(activity.type) }}>
                  {getActivityIcon(activity.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" component="div" sx={{ fontWeight: 'medium' }}>
                    {activity.title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {activity.course}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < activityData.length - 1 && <Divider variant="inset" />}
          </React.Fragment>
        ))}
      </List>
      <Button variant="text" color="primary" fullWidth sx={{ mt: 'auto' }}>
        {t('dashboard.viewAll')}
      </Button>
    </Box>
  );
};

export default RecentActivityList;