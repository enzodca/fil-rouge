import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

export interface JwtPayload {
  id: string;
  role: string;
  organization_id?: string;
  organization_name?: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/auth`;

  constructor(
  ) {}

  getMe() {
    return this.http.get<any>(`${this.API_URL}/me`);
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<{ token: string }>(`${this.API_URL}/login`, data).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    return this.decodeToken()?.id || null;
  }

  getRole(): string | null {
    return this.decodeToken()?.role || null;
  }

  getUsername(): string | null {
    const decoded = this.decodeToken();
    return decoded?.username || decoded?.email || null;
  }

  getOrganizationId(): string | null {
    return this.decodeToken()?.organization_id || null;
  }

  getOrganizationName(): string | null {
    return this.decodeToken()?.organization_name || null;
  }

  hasOrganization(): boolean {
    const decoded = this.decodeToken();
    return !!(decoded?.organization_id && decoded?.organization_name);
  }

  isLoggedIn(): boolean {
    const decoded = this.decodeToken();
    if (!decoded?.exp) return false;
    const now = Date.now() / 1000;
    return decoded.exp > now;
  }

}