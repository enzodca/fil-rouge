import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';
import { NotificationService } from '../../../services/notification/notification.service';

@Component({
  selector: 'app-quiz-leaderboard',
  imports: [SharedModule],
  templateUrl: './quiz-leaderboard.component.html',
  styleUrls: ['./quiz-leaderboard.component.scss']
})
export class QuizLeaderboardComponent implements OnInit {
  quiz: any = null;
  leaderboard: any[] = [];
  totalParticipants = 0;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (!quizId) {
      this.notification.showError('ID du quiz manquant');
      this.router.navigate(['/quiz-list']);
      return;
    }

    this.loadLeaderboard(quizId);
  }

  loadLeaderboard(quizId: string): void {
  this.http.get<any>(`${environment.apiBaseUrl}/quiz/${quizId}/leaderboard`).subscribe({
      next: (data) => {
        this.quiz = data.quiz;
        this.leaderboard = data.leaderboard;
        this.totalParticipants = data.total_participants;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du classement:', error);
        this.notification.showError('Erreur lors du chargement du classement');
        this.loading = false;
      }
    });
  }

  formatTime(seconds: number): string {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPositionClass(position: number): string {
    switch (position) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return '';
    }
  }

  getPositionIcon(position: number): string {
    switch (position) {
      case 1: return 'emoji_events';
      case 2: return 'emoji_events';
      case 3: return 'emoji_events';
      default: return 'person';
    }
  }

  goBackToQuiz(): void {
    this.router.navigate(['/quiz-list']);
  }

  playQuiz(): void {
    this.router.navigate(['/play-quiz', this.quiz._id]);
  }
}
