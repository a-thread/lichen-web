import { Injectable, inject } from "@angular/core";
import { SupabaseClientService } from "../../shared/services/supabase-client.service";
import { Note } from "./note.model";

@Injectable({ providedIn: "root" })
export class NotesApiService {
  private readonly supabase = inject(SupabaseClientService);

  async fetchNotes(userId: string): Promise<Note[]> {
    const { data, error } = await this.supabase.client
      .from("note")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data as Note[];
  }

  async upsertNote(note: Note): Promise<void> {
    const { error } = await this.supabase.client.from("note").upsert(note);
    if (error) throw error;
  }

  async deleteNote(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("note")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }
}
