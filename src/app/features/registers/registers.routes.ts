import { Routes } from '@angular/router';
import { TabsPage } from '../tabs/tabs.page';

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
    component: TabsPage,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/main-register/main-register.page').then((m) => m.MainRegisterPage)
      }
    ]
  }
];
