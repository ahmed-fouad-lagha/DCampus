import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Alert, CircularProgress, Divider, List, ListItem, ListItemText } from '@mui/material';
import { supabase, getConnectionStatus } from '../config/supabase';
import testSupabaseConnection from '../utils/tests/testSupabaseConnection';

interface TestResult {
  success: boolean;
  error?: any;
  data?: any;
  responseTime?: number;
  status?: any;
}

const SupabaseTestPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState(getConnectionStatus());
  
  useEffect(() => {
    // Auto-run connection test on page load
    runConnectionTest();
    
    // Update connection status periodically
    const interval = setInterval(() => {
      setConnectionStatus(getConnectionStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const runConnectionTest = async () => {
    setTesting(true);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: {
          message: 'Unexpected error running test',
          details: error
        }
      });
    } finally {
      setTesting(false);
      setConnectionStatus(getConnectionStatus());
    }
  };

  const checkEnvVariables = () => {
    return {
      url: process.env.REACT_APP_SUPABASE_URL ? true : false,
      key: process.env.REACT_APP_SUPABASE_ANON_KEY ? true : false
    };
  };

  const envVars = checkEnvVariables();

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Supabase Connection Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Environment Variables
        </Typography>
        
        {envVars.url && envVars.key ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Environment variables are correctly configured
          </Alert>
        ) : (
          <Alert severity="error" sx={{ mb: 2 }}>
            Missing environment variables. Check your .env file.
          </Alert>
        )}
        
        <List>
          <ListItem>
            <ListItemText 
              primary="REACT_APP_SUPABASE_URL" 
              secondary={envVars.url ? "Configured ✓" : "Missing ✗"} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="REACT_APP_SUPABASE_ANON_KEY" 
              secondary={envVars.key ? "Configured ✓" : "Missing ✗"} 
            />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Test
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={runConnectionTest} 
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {testing ? 'Testing Connection...' : 'Test Connection'}
          </Button>
        </Box>
        
        {testResult && (
          <>
            {testResult.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully connected to Supabase! ({testResult.responseTime}ms)
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to connect to Supabase
              </Alert>
            )}
            
            <Typography variant="subtitle2">Response Details:</Typography>
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2, maxHeight: 200, overflow: 'auto' }}>
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </Box>
          </>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              bgcolor: connectionStatus.isConnected ? 'success.main' : 'error.main',
              mr: 1 
            }} 
          />
          <Typography>
            {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2">Troubleshooting Tips:</Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Make sure your Supabase project is running and accessible" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Check that your URL and API keys are correct in the .env file" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Verify that your database tables have been created properly" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Ensure your Supabase policies allow the appropriate access" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default SupabaseTestPage;