import { supabase } from "../../../lib/superbaseClient";

export const PERSONALIZATION_UPDATED_EVENT = "personalization-updated";

export interface PersonalizationInput {
  favoriteSources: string[];
  favoriteTopics: string[];
}

export interface UserPersonalization {
  id: string;
  user_id: string;
  user_email: string;
  favorite_sources: string[];
  favorite_topics: string[];
  created_at: string;
  updated_at: string;
}

function isMissingRelationError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message ?? "").toLowerCase().includes("schema cache")
  );
}

function normalizeUniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function resolveUserEmail(userEmail: string | null | undefined) {
  if (userEmail && userEmail.trim()) return userEmail.trim();
  if (typeof window !== "undefined") {
    const localEmail = localStorage.getItem("auth_email");
    if (localEmail && localEmail.trim()) return localEmail.trim();
  }
  return "";
}

async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not logged in");
  return data.user;
}

export function broadcastPersonalizationUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PERSONALIZATION_UPDATED_EVENT));
}

export async function getUserPersonalization() {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("user_personalization")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return { data: null, error: null };
    }
    return { data: null, error };
  }

  if (!data) return { data: null, error: null };

  const parsedData: UserPersonalization = {
    ...data,
    favorite_sources: Array.isArray(data.favorite_sources)
      ? (data.favorite_sources as string[])
      : [],
    favorite_topics: Array.isArray(data.favorite_topics)
      ? (data.favorite_topics as string[])
      : [],
  };

  return { data: parsedData, error: null };
}

export async function saveUserPersonalization(input: PersonalizationInput) {
  const user = await getAuthenticatedUser();
  const userEmail = resolveUserEmail(user.email);

  const favoriteSources = normalizeUniqueStrings(input.favoriteSources);
  const favoriteTopics = normalizeUniqueStrings(input.favoriteTopics);

  return supabase.from("user_personalization").upsert(
    {
      user_id: user.id,
      user_email: userEmail,
      favorite_sources: favoriteSources,
      favorite_topics: favoriteTopics,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );
}

export async function discardUserPersonalization() {
  const user = await getAuthenticatedUser();

  return supabase.from("user_personalization").delete().eq("user_id", user.id);
}
