import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Đợi cho đến khi AuthService load xong (isLoading = false)
    return authService.isLoading$.pipe(
        filter(isLoading => !isLoading), // Chỉ tiếp tục khi đã load xong
        take(1),
        switchMap(() => authService.currentUser$.pipe(
            take(1),
            map(user => {
                const expectedRole = route.data['role'];

                if (user && (!expectedRole || user.role === expectedRole)) {
                    return true;
                }

                // If not authenticated or wrong role, redirect to login (or access denied)
                return router.createUrlTree(['/login']);
            })
        ))
    );
};
