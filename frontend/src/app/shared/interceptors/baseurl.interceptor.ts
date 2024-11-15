import {Inject, Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {

  constructor(
    @Inject('BASE_API_URL') private baseUrl: string) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('http') || req.headers.has('X-Skip-Interceptor')) {
      return next.handle(req);  // Skip adding the base URL
    }
    const apiReq = req.clone({ url: `${this.baseUrl}/${req.url}` });
    return next.handle(apiReq);
  }
}
