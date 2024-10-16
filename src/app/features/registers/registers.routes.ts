import { Routes } from '@angular/router';

export const registerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'select-institution',
    pathMatch: 'full'
  },
  {
    path: 'select-institution',
    loadComponent: () => import('./pages/select-institution/select-institution.page').then((m) => m.SelectInstitutionPage),
  },
  {
    path: 'select-institution/:idInstitution',
    loadComponent: () => import('./pages/main-register/main-register.page').then((m) => m.MainRegisterPage)
  }
];
