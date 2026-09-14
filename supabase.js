import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// These are the PUBLIC Supabase connection values for the HSV-Runde web app.
// The publishable key is designed to be used in a browser. Database security
// is provided by Supabase Row Level Security (RLS), which we enabled in SQL.
const SUPABASE_URL = "https://jijwwlfztiqwjywtpsjh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0tvGt7GPnfxW0U85DIOZmw_ZL9MszGp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
