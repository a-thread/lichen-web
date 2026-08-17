import { Injectable, inject } from "@angular/core";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { SupabaseClientService } from "../../shared/services/supabase-client.service";

/** Pure I/O wrapper around Supabase auth. Holds no state — see auth.store.ts for that. */
@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);

  getSession() {
    return this.supabase.client.auth.getSession();
  }

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.supabase.client.auth.onAuthStateChange(callback);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: window.location.origin,
      },
    );
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
