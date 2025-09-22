import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';


export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
const auth = inject(AuthService);
const router = inject(Router);
const expected = (route.data?.['roles'] as string[]) || [];
const mine = auth.getRoles();
const ok = expected.length === 0 || mine.some(r => expected.includes(r));
if (!ok) { router.navigate(['/unauthorized']); return false; }
return true;
};