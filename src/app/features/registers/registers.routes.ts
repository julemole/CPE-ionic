import { Routes } from '@angular/router';

export const registerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'select-institution',
    pathMatch: 'full'
  },
  {
    path: 'select-institution',
    loadComponent: () => import('./pages/select-institution/select-institution.page').then((m) => m.SelectInstitutionPage)
  }
];
