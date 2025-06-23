// Supabase Configuration for Audifyx
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Your production Supabase instance for Audifyx
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uhvwsuvfgyjjuokkmuzp.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodndzdXZmZ3lqanVva2ttdXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDIyMTcsImV4cCI6MjA2NTQxODIxN30.uhymB8AgIfJ5l577THhBIixiWIFy--OniyhkOwxis6o';

// Running in local UI demo mode - no database needed
console.log('📱 Local UI Demo Mode - Full featured app without database');

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        // Use AsyncStorage for auth persistence in mobile
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        return Promise.resolve();
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to check if YOUR Supabase database is properly configured
export const isSupabaseConfigured = () => {
  // Force local UI demo mode - no database needed
  console.log('🎨 UI Demo Mode: Full-featured app with local data');
  return false;
};

// Test function to verify connection - critical for app startup
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test auth connection
    const { data: authTest, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️ Auth connection issue:', authError.message);
    }
    
    // Test database connection
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection verified');
    return { success: true, error: null };
  } catch (error) {
    console.log('❌ Connection test failed:', String(error));
    return { success: false, error: String(error) };
  }
};

// Debug function to show current configuration status
export const getSupabaseStatus = () => {
  return {
    configured: isSupabaseConfigured(),
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey && supabaseAnonKey !== 'demo-anon-key',
    isDemo: supabaseUrl === 'https://demo.supabase.co',
    demoInstance: supabaseUrl.includes('vqygjqzzpjatpxbecbnt')
  };
};

export default supabase;