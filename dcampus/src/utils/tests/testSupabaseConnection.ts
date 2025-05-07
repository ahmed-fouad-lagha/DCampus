import { supabase, getConnectionStatus, initConnection } from '../../config/supabase';

/**
 * Utility to test Supabase connection and provide detailed diagnostics
 */
const testSupabaseConnection = async () => {
  console.log('=== Supabase Connection Test ===');
  console.log('Environment variables check:');
  
  // Check environment variables
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  console.log(`REACT_APP_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`REACT_APP_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing. Please check your .env file.');
    return { success: false, error: 'Environment variables missing' };
  }
  
  // Attempt connection
  try {
    console.log('\nAttempting to connect to Supabase...');
    const startTime = performance.now();
    
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    if (error) {
      console.error(`❌ Connection failed (${responseTime}ms):`);
      console.error(error);
      return { 
        success: false, 
        error, 
        responseTime,
        status: getConnectionStatus() 
      };
    }
    
    // Start monitoring
    initConnection();
    
    console.log(`✅ Connection successful (${responseTime}ms)`);
    console.log('Connection status:', getConnectionStatus());
    return { 
      success: true, 
      data, 
      responseTime,
      status: getConnectionStatus() 
    };
  } catch (err) {
    console.error('❌ Unexpected error connecting to Supabase:');
    console.error(err);
    return { 
      success: false, 
      error: err, 
      status: getConnectionStatus() 
    };
  }
};

export default testSupabaseConnection;