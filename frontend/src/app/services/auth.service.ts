import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';


export interface JwtPayload {
  id: string;
  role: string;
  organization_id?: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/auth`;

  register(data: { username: string; email: string; password: string }) {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<{ token: string }>(`${this.API_URL}/login`, data).pipe(
      tap(res => localStorage.setItem('token', res.token))
    );
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.id;
    } catch {
      return null;
    }
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role;
    } catch {
      return null;
    }
  }

  getUsername(): string | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<any>(token);
    return decoded.username || decoded.email;
  } catch {
    return null;
  }
}

isLoggedIn(): boolean {
  const token = this.getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<any>(token);
    const exp = decoded.exp;
    if (!exp) return false;
    const now = Date.now().valueOf() / 1000;
    return exp > now;
  } catch {
    return false;
  }
}


}
