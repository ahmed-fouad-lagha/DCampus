import React from 'react';
import { 
  Box, List, ListItem, ListItemText, Typography, 
  Button, Chip, Stack, Paper
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Event types
type EventType = 'workshop' | 'deadline' | 'lecture' | 'meeting';

interface EventItem {
  id: number;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  isRegistered: boolean;
}

interface UpcomingEventsListProps {
  onEventClick?: (eventId: number) => void;
}

// Mock data for upcoming events
const eventsData: EventItem[] = [
  {
    id: 1,
    title: 'AI Workshop: Introduction to Neural Networks',
    type: 'workshop',
    date: 'May 10, 2025',
    time: '10:00 AM - 12:00 PM',
    location: 'Computer Science Building, Room A101',
    isRegistered: true
  },
  {
    id: 2,
    title: 'Machine Learning Project Deadline',
    type: 'deadline',
    date: 'May 12, 2025',
    time: '11:59 PM',
    location: 'Online Submission',
    isRegistered: false
  },
  {
    id: 3,
    title: 'Guest Lecture: Future of Data Science',
    type: 'lecture',
    date: 'May 15, 2025',
    time: '2:00 PM - 4:00 PM',
    location: 'University Auditorium',
    isRegistered: false
  },
  {
    id: 4,
    title: 'Student-Faculty Committee Meeting',
    type: 'meeting',
    date: 'May 18, 2025',
    time: '3:30 PM - 5:00 PM',
    location: 'Admin Building, Conference Room 3',
    isRegistered: true
  }
];

const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({ onEventClick }) => {
  const { t } = useTranslation();

  // Get color based on event type
  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'workshop':
        return '#1976d2'; // blue
      case 'deadline':
        return '#e53935'; // red
      case 'lecture':
        return '#43a047'; // green
      case 'meeting':
        return '#9c27b0'; // purple
      default:
        return '#757575'; // gray
    }
  };

  // Get background color with reduced opacity
  const getEventBgColor = (type: EventType) => {
    return `${getEventColor(type)}10`; // 10% opacity
  };

  // Handle event click
  const handleEventClick = (eventId: number) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ flexGrow: 1, overflow: 'auto', mb: 1, p: 0 }}>
        {eventsData.map((event) => (
          <Paper 
            key={event.id}
            elevation={1}
            sx={{ 
              mb: 2, 
              p: 2,
              borderLeft: `4px solid ${getEventColor(event.type)}`,
              cursor: onEventClick ? 'pointer' : 'default',
              '&:hover': onEventClick ? { 
                boxShadow: 3,
                bgcolor: 'action.hover' 
              } : {}
            }}
            onClick={() => handleEventClick(event.id)}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              {event.title}
            </Typography>
            
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <CalendarIcon sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                <Typography variant="body2">
                  {event.date}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <TimeIcon sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                <Typography variant="body2">
                  {event.time}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <LocationIcon sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                <Typography variant="body2" noWrap>
                  {event.location}
                </Typography>
              </Box>
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip 
                size="small" 
                label={event.type.toUpperCase()} 
                sx={{ 
                  bgcolor: getEventBgColor(event.type),
                  color: getEventColor(event.type),
                  fontWeight: 'medium'
                }}
              />
              
              <Button 
                size="small" 
                variant={event.isRegistered ? "outlined" : "contained"}
                color={event.isRegistered ? "secondary" : "primary"}
              >
                {event.isRegistered ? t('events.registered') : t('events.register')}
              </Button>
            </Box>
          </Paper>
        ))}
      </List>
      
      <Button variant="text" color="primary" fullWidth sx={{ mt: 'auto' }}>
        {t('dashboard.viewAll')}
      </Button>
    </Box>
  );
};

export default UpcomingEventsList;