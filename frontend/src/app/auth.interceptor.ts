import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const nextReq = req.withCredentials ? req : req.clone({ withCredentials: true });
  return next(nextReq);
};
