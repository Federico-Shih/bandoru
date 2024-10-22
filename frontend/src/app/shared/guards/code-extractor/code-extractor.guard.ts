import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {AuthService} from "../../data-access/auth-service/auth.service";
import {catchError, from, map, switchMap} from "rxjs";

// Validar que el codigo que se saca de ?code= en la URL sea valido y hace inicio de sesion
export const codeExtractorGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const authCode: string = route.queryParams['code'];
  if (authCode == null) {
    return router.navigate(['/']).then(() => false);
  }
  return router.navigate(['/']).then(() => false);

  // return authService.getCodeGrantToken(authCode, window.location.origin + state.url.split('?')[0])
  //   .pipe(switchMap(() => from(router.navigate(['/'])).pipe(map(() => true))))
  //   .pipe(catchError(() => from(router.navigate(['/'])).pipe(map(() => false))));
};
