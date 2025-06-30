import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './quiz-list.component.html'
})
export class QuizListComponent implements OnInit {
  userId = '';
  role = '';
  quizzes: any[] = [];

  constructor(private http: HttpClient, private auth: AuthService) {
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
    if (!confirm('Supprimer ce quiz ?')) return;
    this.http.delete(`${environment.apiUrl}/quiz/${id}`).subscribe({
      next: () => {
        this.quizzes = this.quizzes.filter(q => q._id !== id);
        alert('Quiz supprimé');
      },
      error: err => alert('Erreur suppression : ' + err.error.message)
    });
  }

  inviteUser(quizId: string) {
    const email = prompt('Email à inviter ?');
    if (!email) return;

    this.http.put(`${environment.apiUrl}/quiz/${quizId}/invite`, { email }).subscribe({
      next: () => alert('Utilisateur invité'),
      error: err => alert('Erreur : ' + err.error.message)
    });
  }

}
