import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-quiz-list',
  imports: [SharedModule],
  templateUrl: './quiz-list.component.html'
})
export class QuizListComponent implements OnInit {
  userId = '';
  role = '';
  quizzes: any[] = [];

  constructor(
    private http: HttpClient, 
    private auth: AuthService,
    private notification: NotificationService
  ) {
    this.userId = this.auth.getUserId() || '';
    this.role = this.auth.getRole() || '';
  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/quiz/all`).subscribe({
      next: data => (this.quizzes = data)
    });
  }

  canDelete(quiz: any): boolean {
    return this.role === 'admin' || quiz.creator_id?._id === this.userId;
  }

  deleteQuiz(id: string) {
    this.notification.confirm('Supprimer ce quiz ?').subscribe(confirmed => {
      if (confirmed) {
        this.http.delete(`${environment.apiUrl}/quiz/${id}`).subscribe({
          next: () => {
            this.quizzes = this.quizzes.filter(q => q._id !== id);
            this.notification.showSuccess('Quiz supprimé');
          },
          error: err => this.notification.showError('Erreur suppression : ' + (err.error?.message || 'Erreur inconnue'))
        });
      }
    });
  }

  inviteUser(quizId: string) {
    const email = prompt('Email à inviter ?');
    if (!email) return;
    this.http.put(`${environment.apiUrl}/quiz/${quizId}/invite`, { email }).subscribe({
      next: () => this.notification.showSuccess('Utilisateur invité'),
      error: err => this.notification.showError('Erreur : ' + (err.error?.message || 'Erreur inconnue'))
    });
  }
}