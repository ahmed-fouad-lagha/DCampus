import React, { useState, useEffect } from 'react';
import { Box, Typography, Switch, FormControlLabel, Select, MenuItem, SelectChangeEvent, Tooltip, Button } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);

  // Replace local darkMode state with ThemeContext
  const { mode, toggleTheme } = useTheme();

  // Load settings from local storage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('settings_language');
    const savedNotifications = localStorage.getItem('settings_notifications');

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedNotifications) setNotifications(savedNotifications === 'true');
  }, []);

  // Save settings to local storage
  const saveSettings = () => {
    localStorage.setItem('settings_language', language);
    localStorage.setItem('settings_notifications', notifications.toString());
    alert('Settings saved successfully!');
  };

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    setLanguage(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>

        <Tooltip title="Toggle between light and dark mode">
          <FormControlLabel
            control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
            label="Dark Mode"
          />
        </Tooltip>

        <Tooltip title="Enable or disable notifications">
          <FormControlLabel
            control={<Switch checked={notifications} onChange={() => setNotifications(!notifications)} />}
            label="Enable Notifications"
          />
        </Tooltip>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">Language</Typography>
          <Select value={language} onChange={handleLanguageChange} fullWidth>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="ar">Arabic</MenuItem>
          </Select>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Button variant="contained" color="primary" onClick={saveSettings}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage;