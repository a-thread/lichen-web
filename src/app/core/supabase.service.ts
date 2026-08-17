import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../environments/environment";
import { Note } from "./note.model";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  async fetchNotes(): Promise<Note[]> {
    const { data, error } = await this.client
      .from("note")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data as Note[];
  }

  async upsertNote(note: Note): Promise<void> {
    const { error } = await this.client.from("note").upsert(note);
    if (error) throw error;
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await this.client.from("note").delete().eq("id", id);
    if (error) throw error;
  }
}
