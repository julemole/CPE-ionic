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
    path: 'change-pass',
    loadComponent: () => import('./pages/change-pass/change-pass.page').then((m) => m.ChangePassPage),
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
      { path: ':idRegister', loadComponent: () => import('../registers/pages/main-register/main-register.page').then((m) => m.MainRegisterPage) },
      {
        path: ':idRegister/photo/:idPhoto',
        loadComponent: () => import('../registers/pages/add-photo/add-photo.page').then((m) => m.AddPhotoPage)
      },
      {
        path: ':idRegister/attached/:attachId',
        loadComponent: () => import('../registers/pages/add-attached/add-attached.page').then((m) => m.AddAttachedPage)
      },
    ]
  }
]
