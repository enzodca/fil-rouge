import { TestBed } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TokenInterceptor } from './token.interceptor';
import { AuthService } from '../services/auth/auth.service';

class AuthServiceMock {
  token: string | null = 'test-token';
  getToken() { return this.token; }
  logout = jasmine.createSpy('logout');
}

describe('TokenInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthServiceMock;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
        { provide: AuthService, useClass: AuthServiceMock },
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  auth = TestBed.inject(AuthService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('ajoute le header Authorization quand un token est présent', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({ ok: true });
  });

  it('n\'ajoute pas le header Authorization quand pas de token', () => {
    auth.token = null;
    http.get('/api/test2').subscribe();
    const req = httpMock.expectOne('/api/test2');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('déconnecte et redirige sur 401/403', () => {
    http.get('/api/protected').subscribe({
      next: () => fail('should error'),
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      }
    });

    const req = httpMock.expectOne('/api/protected');
    req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
  expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
