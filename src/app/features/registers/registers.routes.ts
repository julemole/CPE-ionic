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
  },
  {
    path: 'select-institution/:idInstitution/add-photo',
    loadComponent: () => import('./pages/add-photo/add-photo.page').then((m) => m.AddPhotoPage)
  },
  {
    path: 'select-institution/:idInstitution/add-attached',
    loadComponent: () => import('./pages/add-attached/add-attached.page').then((m) => m.AddAttachedPage)
  },
  {
    path: 'select-institution/:idInstitution/signature',
    loadComponent: () => import('./pages/signature-pad/signature-pad.page').then((m) => m.SignaturePadPage)
  }
];
