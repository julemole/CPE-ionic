import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../menu/pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'tracing',
        loadComponent: () => import('./pages/tracings/tracings.page').then((m) => m.TracingsPage),
      },
      {
        path: 'tracing/add',
        loadComponent: () => import('./pages/add-tracing/add-tracing.page').then((m) => m.AddTracingPage),
      },
      {
        path: 'tracing/:tracingId',
        loadComponent: () => import('./pages/tracing-detail/tracing-detail.page').then((m) => m.TracingDetailPage),
      },
      {
        path: 'tracing/:id/photo-evidence/:photoId',
        loadComponent: () => import('./pages/photo-evidence/photo-evidence.page').then((m) => m.PhotoEvidencePage),
      },
      {
        path: 'tracing/photo-evidence/add',
        loadComponent: () => import('./pages/add-photo/add-photo.page').then((m) => m.AddPhotoPage),
      },
      {
        path: 'tracing/photo-evidence/:photoId',
        loadComponent: () => import('./pages/add-photo/add-photo.page').then((m) => m.AddPhotoPage),
      },
      {
        path: 'tracing/:id/attached/:attachedId',
        loadComponent: () => import('./pages/attached/attached.page').then((m) => m.AttachedPage),
      },
      {
        path: 'tracing/attached/add',
        loadComponent: () => import('./pages/add-attached/add-attached.page').then((m) => m.AddAttachedPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
  {
    path: 'add-tracing',
    loadComponent: () => import('./pages/add-tracing/add-tracing.page').then( m => m.AddTracingPage)
  },
  {
    path: 'add-photo',
    loadComponent: () => import('./pages/add-photo/add-photo.page').then( m => m.AddPhotoPage)
  },
  {
    path: 'add-attached',
    loadComponent: () => import('./pages/add-attached/add-attached.page').then( m => m.AddAttachedPage)
  },
];
