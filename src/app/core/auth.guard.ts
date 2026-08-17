import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isInitializing()) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (!auth.isInitializing()) {
          clearInterval(check);
          resolve();
        }
      }, 25);
    });
  }

  if (auth.userId()) return true;
  return router.parseUrl('/login');
};
