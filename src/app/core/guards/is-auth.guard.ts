import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const isAuthGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('TOKEN');
  const router = inject(Router);

  if(token){
    router.navigate(['/home']);
    return false;
  }
  return true;
};
