import { Routes } from '@angular/router';
import {codeExtractorGuard} from "./shared/guards/code-extractor/code-extractor.guard";
import {logoutGuard} from "./shared/guards/logout/logout.guard";

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'share/:id',
    loadComponent: () => import('./features/view-bundle/view-bundle.component').then(m => m.ViewBundleComponent)
  },
  {
    path: 'login-success',
    loadComponent: () => import('./features/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
    canActivate: [codeExtractorGuard]
  },
  {
    path: 'logout',
    loadComponent: () => import('./features/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
    canActivate: [logoutGuard],
  },
  {
    path: 'my-bandorus',
    loadComponent: () => import('./features/my-bundles/my-bundles.component').then(m => m.MyBundlesComponent)
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
];
