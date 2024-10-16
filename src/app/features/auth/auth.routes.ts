import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((c) => c.LoginPage),
  },
  {
    path: 'recover-pass',
    loadComponent: () => import('./pages/recover-pass/recover-pass.page').then((c) => c.RecoverPassPage),
  },
  {
    path: 'reset-pass',
    loadComponent: () => import('./pages/reset-pass/reset-pass.page').then((c) => c.ResetPassPage),
  }

];
