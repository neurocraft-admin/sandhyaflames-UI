import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { hasPerm } from './permissions';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const res = route.data?.['resource'] as string;
  const need = route.data?.['need'] as number;

  const mask = auth.getPermissionFor(res);
  if (!hasPerm(mask, need)) {
    router.navigate(['/unauthorized']);
    return false;
  }
  return true;
};
