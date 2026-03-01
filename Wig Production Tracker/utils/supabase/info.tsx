/* Supabase Configuration - Use environment variables for security */

export const projectId = import.meta.env.VITE_SUPABASE_URL 
  ? import.meta.env.VITE_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
  : "jdrcupieskahkmpcziwu";

export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcmN1cGllc2thaGttcGN6aXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODI2MDQsImV4cCI6MjA4Nzk1ODYwNH0.1BlSJSdmQ8_8_CQLDCx6TAuuSt7hXbwF6CXvY8qJYbk";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
