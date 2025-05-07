const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client with service role key (for admin operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration. Please check your .env file.");
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Export Supabase client and auth for use in other modules
module.exports = {
  supabase,
  auth: supabase.auth, // In recent versions, admin methods are directly on auth
};
