import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';

class AuthServiceMock {
  logged = true;
  isLoggedIn() { return this.logged; }
  logout = jasmine.createSpy('logout');
}

describe('authGuard', () => {
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

  it('laisse passer si connecté', () => {
    auth.logged = true;
    const can = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(can).toBeTrue();
  });

  it('redirige vers /login si non connecté', () => {
    auth.logged = false;
    const can = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(can).toBeFalse();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
