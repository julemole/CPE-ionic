import { Routes } from '@angular/router';
import { isAuthGuard } from './core/guards/is-auth.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // {
  //   path: '',
  //   canActivate: [authGuard],
  //   loadChildren: () => import('./features/tabs/tabs.routes').then((m) => m.routes),
  // },
  {
    path: '',
    canActivate: [isAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./features/menu/menu.routes').then((m) => m.menuRoutes),
  }
];
