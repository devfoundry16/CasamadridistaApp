import { createClient } from '@supabase/supabase-js';
import { development } from './environment';

// Supabase configuration
// Use EXPO_PUBLIC_ vars so they are available at build/runtime. Must match backend .env SUPABASE_URL / SUPABASE_ANON_KEY.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://owqbefeponklfvkgehqz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cWJlZmVwb25rbGZ2a2dlaHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgzOTQsImV4cCI6MjA4NjQwNDM5NH0.AaOJmDul36_2j9cUnBU_v_iUi1UGKzE80HseKFRtTQU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Backend API base URL
export const API_BASE_URL = development.DEFAULT_BACKEND_API_URL || 'http://localhost:3000/api/';
