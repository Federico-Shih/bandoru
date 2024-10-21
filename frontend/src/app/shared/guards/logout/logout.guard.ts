import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "../../data-access/auth-service/auth.service";
import {from, map, switchMap} from "rxjs";

export const logoutGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.logout().pipe(switchMap(() => from(router.navigate(['/']))), map(() => true));
};
