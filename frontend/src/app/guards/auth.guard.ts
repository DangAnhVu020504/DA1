import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map(user => {
            const expectedRole = route.data['role'];

            if (user && (!expectedRole || user.role === expectedRole)) {
                return true;
            }

            // If not authenticated or wrong role, redirect to login (or access denied)
            return router.createUrlTree(['/login']);
        })
    );
};
