import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private API_URL = 'http://localhost:3000/api/auth';

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
}
