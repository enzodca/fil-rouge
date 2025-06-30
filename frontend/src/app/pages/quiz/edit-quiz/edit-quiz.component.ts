import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-edit-quiz',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './edit-quiz.component.html'
})
export class EditQuizComponent implements OnInit {
  quizId = '';
  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      title: '',
      description: '',
      visibility: 'public',
      allowed_emails: this.fb.array([]),
      questions: this.fb.array([])
    });
  }

  get questions() {
    return this.form.get('questions') as FormArray;
  }

  get allowedEmails() {
    return this.form.get('allowed_emails') as FormArray;
  }

  getAnswers(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('answers') as FormArray;
  }

  addQuestion(q?: any) {
    const question = this.fb.group({
      content: q?.content || '',
      type: q?.type || 'QCM',
      answers: this.fb.array(
        (q?.answers || []).map((a: any) =>
          this.fb.group({ content: a.content, is_correct: a.is_correct })
        )
      )
    });
    this.questions.push(question);
  }

  addAnswer(qIndex: number) {
    const answers = this.questions.at(qIndex).get('answers') as FormArray;
    answers.push(this.fb.group({ content: '', is_correct: false }));
  }

  ngOnInit() {
    this.quizId = this.route.snapshot.paramMap.get('id') || '';
    this.http.get<any>(`${environment.apiUrl}/quiz/${this.quizId}`).subscribe({
      next: data => {
        this.form.patchValue({
          title: data.title,
          description: data.description,
          visibility: data.visibility || 'public'
        });
        for (let q of data.questions) {
          this.addQuestion(q);
        }
        if (data.visibility === 'private' && data.allowed_emails) {
          const emailArray = this.form.get('allowed_emails') as FormArray;
          data.allowed_emails.forEach((e: string) => emailArray.push(this.fb.control(e)));
        }
      },
      error: err => {
        alert('Quiz introuvable'); this.router.navigate(['/quiz-list']);
      }
    });
  }

  submit() {
    this.http.put(`${environment.apiUrl}/quiz/${this.quizId}`, this.form.value).subscribe({
      next: () => {
        alert('Quiz mis à jour !');
        this.router.navigate(['/quiz-list']);
      },
      error: err => alert('Erreur : ' + err.error.message)
    });
  }

  addEmail() {
    const emails = this.form.get('allowed_emails') as FormArray;
    emails.push(this.fb.control(''));
  }

}
