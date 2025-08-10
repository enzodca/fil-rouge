import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth/auth.service';

class AuthServiceMock {
  logged = false;
  isLoggedIn() { return this.logged; }
}

describe('guestGuard', () => {
  let router: Router;
  let auth: AuthServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock }
      ]
    });

  auth = TestBed.inject(AuthService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('laisse passer si non connecté', () => {
    auth.logged = false;
    const can = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
    expect(can).toBeTrue();
  });

  it('redirige vers /accueil si déjà connecté', () => {
    auth.logged = true;
    const can = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
    expect(can).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/accueil']);
  });
});
