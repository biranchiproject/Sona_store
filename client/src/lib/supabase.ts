
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables! Check .env file.');
} else {
    console.log('✅ Supabase Client Initializing...');
    console.log('   URL:', supabaseUrl);
    // Don't log full key for security, just presence
    console.log('   Key Present:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
