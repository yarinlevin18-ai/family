import { createClient } from "@supabase/supabase-js";

// Defaults point at the provisioned trip-album project. The publishable key is
// meant to be shipped to browsers; RLS and bucket policies limit what it can do.
// Override with NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const DEFAULT_URL = "https://zgfkoyqlnshiivyzhumz.supabase.co";
const DEFAULT_KEY = "sb_publishable_iDSeFwvNBfzt2aUn6amSLg_pRyT6XL9";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const supabase = createClient(url, anonKey);

export const PHOTOS_BUCKET = "photos";
