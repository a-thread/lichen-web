import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly userId = signal<string | null>(null);
  readonly isInitializing = signal(true);
  /** Set true when Supabase redirects back with a password-recovery link. */
  readonly passwordRecoveryPending = signal(false);

  constructor(private supabase: SupabaseService) {
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.userId.set(data.session?.user?.id ?? null);
      this.isInitializing.set(false);
    });

    this.supabase.client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.passwordRecoveryPending.set(true);
      }
      this.userId.set(session?.user?.id ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
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
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) throw error;
    this.passwordRecoveryPending.set(false);
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
