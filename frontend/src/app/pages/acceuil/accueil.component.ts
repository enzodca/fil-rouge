import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-accueil',
  imports: [SharedModule],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent implements OnInit {
  user: any = null;
  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/auth/me`).subscribe({
      next: user => this.user = user,
      error: () => this.router.navigate(['/login'])
    });
  }
}
