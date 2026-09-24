import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomePage),
  },
  {
    path: 'questionnaire',
    loadComponent: () => import('./pages/questionnaire/questionnaire.component').then(m => m.QuestionnairePage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfilePage),
  },
  {
    path: 'consent',
    loadComponent: () => import('./pages/consent/consent.component').then(m => m.ConsentPage),
  },
  { path: '**', redirectTo: '' },
];
