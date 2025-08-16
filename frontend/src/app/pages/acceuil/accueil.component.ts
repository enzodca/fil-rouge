import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { QuizService } from '../../services/quiz/quiz.service';

@Component({
  selector: 'app-accueil',
  imports: [SharedModule],
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.scss']
})
export class AccueilComponent implements OnInit {
  user: any = null;
  stats = {
    totalQuizzes: 0,
    totalUsers: 0,
    totalGamesPlayed: 0
  };
  
  private http = inject(HttpClient);
  private router = inject(Router);
  private quizService = inject(QuizService);

  ngOnInit(): void {
  this.http.get<any>(`${environment.apiBaseUrl}/auth/me`).subscribe({
      next: user => this.user = user,
      error: () => this.router.navigate(['/login'])
    });
    
    this.loadStats();
  }
  
  private loadStats(): void {
    this.quizService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }
}
