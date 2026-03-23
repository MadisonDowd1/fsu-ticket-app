import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pbfrxnmjarhjpogehnbc.supabase.co";
const supabaseAnonKey = "sb_publishable_8Mb0NUbpfM6xQrfBKdwxJg_009cUETw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);