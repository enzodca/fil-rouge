import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-play-quiz',
  imports: [SharedModule],
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
    this.http.get<any>(`${environment.apiUrl}/quiz/${this.quizId}`).subscribe({
      next: data => {
        this.questions = data.questions;
        for (let q of this.questions) {
          if (q.type === 'QCM') {
            const answersFormArray = this.fb.array(
              q.answers.map(() => this.fb.control(false))
            );
            this.form.addControl(q._id, answersFormArray);
          } else {
            this.form.addControl(q._id, this.fb.control(null));
          }
        }
      },
      error: () => {
        alert('Quiz introuvable');
        this.router.navigate(['/quiz-list']);
      }
    });
  }

  getAnswersFormArray(questionId: string): FormArray {
    return this.form.get(questionId) as FormArray;
  }

  onSubmit() {
    let total = 0;
    for (const question of this.questions) {
      if (question.type === 'QCM') {
        const selectedAnswers = this.form.value[question._id];
        const correctAnswers = question.answers.map((a: any) => a.is_correct);
        
        const isCorrect = selectedAnswers.length === correctAnswers.length &&
          selectedAnswers.every((selected: boolean, index: number) => 
            selected === correctAnswers[index]
          );
        
        if (isCorrect) total++;
      } else {
        const selected = this.form.value[question._id];
        const correct = question.answers.find((a: any) => a.is_correct)?.content;
        if (selected === correct) total++;
      }
    }
    this.score = total;
  }
}