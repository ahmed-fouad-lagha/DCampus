import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  Tooltip, 
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormGroup,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
  // User preferences
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dashboardNotifications, setDashboardNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [gradeAlerts, setGradeAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // UI state management
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Replace local darkMode state with ThemeContext
  const { mode, toggleTheme } = useTheme();

  // Load settings from local storage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('settings_language');
    const savedNotifications = localStorage.getItem('settings_notifications');
    const savedFontSize = localStorage.getItem('settings_fontSize');
    const savedHighContrast = localStorage.getItem('settings_highContrast');
    const savedEmailNotifications = localStorage.getItem('settings_emailNotifications');
    const savedDashboardNotifications = localStorage.getItem('settings_dashboardNotifications');
    const savedCourseUpdates = localStorage.getItem('settings_courseUpdates');
    const savedGradeAlerts = localStorage.getItem('settings_gradeAlerts');
    const savedWeeklyDigest = localStorage.getItem('settings_weeklyDigest');
    
    if (savedLanguage) setLanguage(savedLanguage);
    if (savedNotifications) setNotifications(savedNotifications === 'true');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
    if (savedEmailNotifications) setEmailNotifications(savedEmailNotifications === 'true');
    if (savedDashboardNotifications) setDashboardNotifications(savedDashboardNotifications === 'true');
    if (savedCourseUpdates) setCourseUpdates(savedCourseUpdates === 'true');
    if (savedGradeAlerts) setGradeAlerts(savedGradeAlerts === 'true');
    if (savedWeeklyDigest) setWeeklyDigest(savedWeeklyDigest === 'true');
  }, []);

  // Save settings to local storage
  const saveSettings = () => {
    setConfirmOpen(true);
  };
  
  const handleConfirmSave = () => {
    // Save all settings to local storage
    localStorage.setItem('settings_language', language);
    localStorage.setItem('settings_notifications', notifications.toString());
    localStorage.setItem('settings_fontSize', fontSize.toString());
    localStorage.setItem('settings_highContrast', highContrast.toString());
    localStorage.setItem('settings_emailNotifications', emailNotifications.toString());
    localStorage.setItem('settings_dashboardNotifications', dashboardNotifications.toString());
    localStorage.setItem('settings_courseUpdates', courseUpdates.toString());
    localStorage.setItem('settings_gradeAlerts', gradeAlerts.toString());
    localStorage.setItem('settings_weeklyDigest', weeklyDigest.toString());
    
    setConfirmOpen(false);
    setSnackbarOpen(true);
  };
  
  const resetToDefaults = () => {
    setLanguage('en');
    setNotifications(true);
    setFontSize(16);
    setHighContrast(false);
    setEmailNotifications(true);
    setDashboardNotifications(true);
    setCourseUpdates(true);
    setGradeAlerts(true);
    setWeeklyDigest(false);
    
    setSnackbarOpen(true);
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    setLanguage(event.target.value);
  };
  
  const handleFontSizeChange = (_event: Event, newValue: number | number[]) => {
    setFontSize(newValue as number);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Display Preferences</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Tooltip title="Toggle between light and dark mode">
                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                  label="Dark Mode"
                />
              </Tooltip>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Tooltip title="Enable high contrast for better visibility">
                <FormControlLabel
                  control={<Switch checked={highContrast} onChange={() => setHighContrast(!highContrast)} />}
                  label="High Contrast Mode"
                />
              </Tooltip>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>Font Size: {fontSize}px</Typography>
              <Slider
                value={fontSize}
                min={12}
                max={24}
                step={1}
                onChange={handleFontSizeChange}
                valueLabelDisplay="auto"
                marks={[
                  { value: 12, label: 'Small' },
                  { value: 16, label: 'Default' },
                  { value: 20, label: 'Large' },
                  { value: 24, label: 'X-Large' }
                ]}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>Language</Typography>
              <Select value={language} onChange={handleLanguageChange} fullWidth>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="ar">Arabic</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
              </Select>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Notification Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={<Switch checked={notifications} onChange={() => setNotifications(!notifications)} />}
                label="Enable All Notifications"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Notification Channels</Typography>
              <FormControlLabel
                disabled={!notifications}
                control={<Switch checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />}
                label="Email Notifications"
              />
              <FormControlLabel
                disabled={!notifications}
                control={<Switch checked={dashboardNotifications} onChange={() => setDashboardNotifications(!dashboardNotifications)} />}
                label="Dashboard Notifications"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Notification Types</Typography>
              <FormControlLabel
                disabled={!notifications}
                control={<Switch checked={courseUpdates} onChange={() => setCourseUpdates(!courseUpdates)} />}
                label="Course Updates"
              />
              <FormControlLabel
                disabled={!notifications}
                control={<Switch checked={gradeAlerts} onChange={() => setGradeAlerts(!gradeAlerts)} />}
                label="Grade Alerts"
              />
              <FormControlLabel
                disabled={!notifications}
                control={<Switch checked={weeklyDigest} onChange={() => setWeeklyDigest(!weeklyDigest)} />}
                label="Weekly Learning Digest"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Account Privacy</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary" paragraph>
              Manage your account privacy settings and control how your data is used within DCampus.
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Allow profile visibility to other students"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Allow profile visibility to faculty"
              />
              <FormControlLabel
                control={<Switch />}
                label="Share my course activity with other students"
              />
              <FormControlLabel
                control={<Switch />}
                label="Use my data for personalized learning recommendations"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Paper>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button variant="outlined" color="secondary" onClick={resetToDefaults}>
          Reset to Defaults
        </Button>
        <Button variant="contained" color="primary" onClick={saveSettings}>
          Save Settings
        </Button>
      </Box>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Settings Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to save these settings? This will update your preferences across DCampus.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Settings updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;