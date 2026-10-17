import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// عميل خاص بالسيرفر (API Routes) بصلاحيات كاملة لتجاوز RLS بأمان
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// عميل عام للقراءة فقط (مثل جلب القطع للكتالوج)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
