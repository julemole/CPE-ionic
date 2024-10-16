import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpContextToken,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

export const NO_INTERCEPT = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const noIntercept = req.context.get(NO_INTERCEPT);
  const localStorageSv = inject(LocalStorageService);
  const authToken = localStorageSv.getItem('TOKEN');

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Basic ${authToken}`
    }
  })

  if(authToken && !noIntercept) {
    return next(authReq)
  }

  return next(req);
}
