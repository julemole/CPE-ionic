import { Routes } from "@angular/router";


export const menuRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'registers',
    children: [
      { path: 'me', loadComponent: () => import('./pages/my-registers/my-registers.page').then((m) => m.MyRegistersPage) },
      { path: 'add', loadChildren: () => import('../registers/registers.routes').then((m) => m.registerRoutes) },
    ]
  }
]
