export type FavoriteRow = {
  user_id: string;
  certification_id: string;
  created_at: string;
};

import { supabase } from "@/lib/supabase";

export async function isFavorited(userId: string, certificationId: string) {
  const { data, error } = await supabase
    .from<FavoriteRow>("user_favorites")
    .select("certification_id")
    .eq("user_id", userId)
    .eq("certification_id", certificationId)
    .limit(1);
  if (error) return { data: false, error };
  return { data: (data || []).length > 0, error: null };
}

export async function addFavorite(userId: string, certificationId: string) {
  return supabase.from("user_favorites").insert({ user_id: userId, certification_id: certificationId });
}

export async function removeFavorite(userId: string, certificationId: string) {
  return supabase.from("user_favorites").delete().eq("user_id", userId).eq("certification_id", certificationId);
}

export async function listFavorites() {
  return supabase.from("user_favorites").select("*");
} 