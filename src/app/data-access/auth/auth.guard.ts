import { inject } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { filter } from "rxjs/operators";
import { AuthStore } from "./auth.store";

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isInitializing()) {
    await firstValueFrom(
      toObservable(auth.isInitializing).pipe(filter((initializing) => !initializing)),
    );
  }

  if (auth.userId()) return true;
  return router.parseUrl("/login");
};
