import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-accueil',
  imports: [CommonModule],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent implements OnInit {
  user: any = null;
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.http.get('http://localhost:3000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${this.auth.getToken()}`
      }
    }).subscribe({
      next: user => this.user = user,
      error: () => this.router.navigate(['/login'])
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
