import { supabase } from "../../../lib/superbaseClient";
import { generateClientUuid, getVerifiedAuthUser } from "@/lib/clientAuth";

export interface NoteInput {
  article_title: string;
  article_slug: string;
  article_url?: string;
  article_date?: string;
  source_name?: string;
  content: string;
}

export interface UserNote {
  id: string;
  article_title: string;
  article_slug: string;
  article_url: string;
  article_date: string;
  source_name: string;
  content: string;
  created_at: string;
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message ?? "").toLowerCase().includes("schema cache")
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
  const { user, error } = await getVerifiedAuthUser();
  if (error) throw error;
  if (!user) throw new Error("Not logged in");
  return user;
}

function createNoteEntry(note: NoteInput): UserNote {
  return {
    id: generateClientUuid(),
    article_title: note.article_title,
    article_slug: note.article_slug,
    article_url: note.article_url ?? "",
    article_date: note.article_date ?? "",
    source_name: note.source_name ?? "",
    content: note.content,
    created_at: new Date().toISOString(),
  };
}

export async function saveNote(note: NoteInput) {
  const user = await getAuthenticatedUser();
  const userEmail = resolveUserEmail(user.email);
  const entry = createNoteEntry(note);

  const { data: existingRow, error: selectError } = await supabase
    .from("user_notes")
    .select("id, notes")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return { data: null, error: selectError };
  }

  const existingNotes = Array.isArray(existingRow?.notes)
    ? (existingRow.notes as UserNote[])
    : [];
  const nextNotes = [entry, ...existingNotes];

  if (existingRow?.id) {
    return supabase
      .from("user_notes")
      .update({
        notes: nextNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  return supabase.from("user_notes").insert({
    user_id: user.id,
    user_email: userEmail,
    notes: nextNotes,
    updated_at: new Date().toISOString(),
  });
}

export async function getUserNotes() {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("user_notes")
    .select("notes")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return { data: [], error: null };
    }
    return { data: null, error };
  }

  const notes = Array.isArray(data?.notes) ? (data.notes as UserNote[]) : [];
  return { data: notes, error: null };
}

export async function updateNote(id: string, content: string) {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("user_notes")
    .select("notes")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { data: null, error };

  const notes = Array.isArray(data?.notes) ? (data.notes as UserNote[]) : [];
  const updatedNotes = notes.map((note) =>
    note.id === id ? { ...note, content } : note,
  );

  return supabase
    .from("user_notes")
    .update({
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

export async function deleteNote(id: string) {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("user_notes")
    .select("notes")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { data: null, error };

  const notes = Array.isArray(data?.notes) ? (data.notes as UserNote[]) : [];
  const nextNotes = notes.filter((note) => note.id !== id);

  return supabase
    .from("user_notes")
    .update({
      notes: nextNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}
