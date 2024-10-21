import {HttpContextToken, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {catchError, Subject, switchMap} from "rxjs";
import {AuthService} from "../data-access/auth-service/auth.service";
import {inject} from "@angular/core";

let isRefreshing = false;
const isRefreshingNotification: Subject<string | null> = new Subject<string | null>();

export const WITHOUT_AUTH = new HttpContextToken(() => false);

// TODO: redirect to login on 401 after failed refresh
export const addTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const withoutAuth = req.context.get(WITHOUT_AUTH);
  if (withoutAuth) {
    return next(req);
  }
  const request = addToken(req, localStorage.getItem('id_token'));
  const authService = inject(AuthService);

  return next(request).pipe(catchError((err) => {
    if (err?.status === 401) {
      // Retry with refresh token
      if (!isRefreshing) {
        isRefreshing = true;
        return authService.getRefreshGrantToken(localStorage.getItem('refresh_token') ?? '').pipe(catchError(() => {
          isRefreshing = false;
          isRefreshingNotification.next(null);
          return authService.logout().pipe(switchMap(() => {
            throw err;
          }));
        })).pipe(switchMap(({ id_token}) => {
          // SUCCESS REFRESHING
          isRefreshing = false;
          isRefreshingNotification.next(id_token);
          return next(addToken(req, localStorage.getItem('id_token')));
        })).pipe(catchError((err) => {
          // ERROR REFRESHING
          isRefreshing = false;
          isRefreshingNotification.next(null);
          return authService.logout().pipe(switchMap(() => {
            throw err;
          }));
        }));
      } else {
        // WAITING FOR IS_REFRESHING_NOTIFICATION
        return isRefreshingNotification.pipe(switchMap((token) => {
          if (token == null) {
            // ERROR REFRESHING
            throw err;
          }
          // RETRY WITH NEW TOKEN
          return next(addToken(req, token));
        }))
      }
    }
    throw err;
  }));
};

const addToken: (httpReq: HttpRequest<unknown>, token: string | null) => HttpRequest<unknown> = (req, token) => {
  if (token == null) {
    return req;
  }
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
