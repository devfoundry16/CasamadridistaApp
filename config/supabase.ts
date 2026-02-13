import { createClient } from '@supabase/supabase-js';
import { development } from './environment';

// Supabase configuration
// Get your anon key from: Supabase Dashboard > Settings > API > anon/public
const supabaseUrl = 'https://owqbefeponklfvkgehqz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cWJlZmVwb25rbGZ2a2dlaHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgzOTQsImV4cCI6MjA4NjQwNDM5NH0.xQXL0rkZGmEVqGVj8Gt7r_8RiLzgKQW0d6xFRHvQ2kM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Backend API base URL
export const API_BASE_URL = development.DEFAULT_BACKEND_API_URL || 'http://localhost:3000/api/';
