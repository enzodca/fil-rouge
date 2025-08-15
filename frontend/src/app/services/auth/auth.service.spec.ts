import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;

  let httpMock: HttpTestingController;
  const b64url = (obj: any) => {
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
    const b64 = btoa(json).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return b64;
  };
  const makeToken = (payload: any) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.sig`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login stocke le token dans localStorage', () => {
    const creds = { email: 'a@a.com', password: 'x' };
    service.login(creds).subscribe();
  const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'tok' });
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('getters basés sur le token décodé', () => {
    const now = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      id: 'u1', role: 'user', username: 'john', email: 'john@ex.com',
      organization_id: 'org1', organization_name: 'Org', exp: now
    };
    localStorage.setItem('token', makeToken(payload));
    expect(service.getUserId()).toBe('u1');
    expect(service.getRole()).toBe('user');
    expect(service.getUsername()).toBe('john');
    expect(service.getOrganizationId()).toBe('org1');
    expect(service.getOrganizationName()).toBe('Org');
    expect(service.hasOrganization()).toBeTrue();
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('isLoggedIn false si expiré ou token invalide', () => {
    const past = Math.floor(Date.now() / 1000) - 10;
    localStorage.setItem('token', makeToken({ exp: past }));
    expect(service.isLoggedIn()).toBeFalse();
    localStorage.setItem('token', 'not.a.jwt');
    expect(service.isLoggedIn()).toBeFalse();
  });
});
