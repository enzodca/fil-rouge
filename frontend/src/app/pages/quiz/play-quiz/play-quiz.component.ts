import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-play-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './play-quiz.component.html'
})
export class PlayQuizComponent implements OnInit {
  quizId = '';
  questions: any[] = [];
  form: FormGroup;
  score: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('id') || '';

    this.http.get(`${environment.apiUrl}/quiz/${this.quizId}`).subscribe({
      next: (data: any) => {
        this.questions = data.questions;
        for (let q of this.questions) {
          this.form.addControl(q._id, this.fb.control(null));
        }
      },
      error: err => {
        alert('Quiz introuvable');
        this.router.navigate(['/quiz-list']);
      }
    });
  }

  onSubmit() {
    let total = 0;

    for (const question of this.questions) {
      const selected = this.form.value[question._id];
      const correct = question.answers.find((a: any) => a.is_correct)?.content;
      if (selected === correct) total++;
    }

    this.score = total;
  }
}
