import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';


@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './create-quiz.component.html'
})
export class CreateQuizComponent {
  form: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private auth: AuthService) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: '',
      visibility: 'public',
      allowed_emails: this.fb.array([]),
      questions: this.fb.array([]),
      creator_id: ''
    });

    this.addQuestion();
  }

  ngOnInit(): void {
    const id = this.auth.getUserId();
    if (id) {
      this.form.get('creator_id')?.setValue(id);
    } else {
      alert('Non connecté !');
      this.router.navigate(['/login']);
    }
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

  addQuestion() {
    const question = this.fb.group({
      content: ['', Validators.required],
      type: 'QCM',
      answers: this.fb.array([
        this.fb.group({ content: ['', Validators.required], is_correct: false }),
        this.fb.group({ content: ['', Validators.required], is_correct: false })
      ])
    });
    this.questions.push(question);
  }

  addAnswer(qIndex: number) {
    const answers = this.questions.at(qIndex).get('answers') as FormArray;
    answers.push(this.fb.group({ content: ['', Validators.required], is_correct: false }));
  }

  submit() {
    this.errorMessage = '';
    const error = this.validateQuiz();

    if (this.form.invalid || error) {
      this.form.markAllAsTouched();
      if (error) {
        this.errorMessage = error;
      }
      return;
    }

    this.http.post(`${environment.apiUrl}/quiz/create`, this.form.value).subscribe({
      next: () => {
        alert('Quiz créé !');
        this.router.navigate(['/accueil']);
      },
      error: err => this.errorMessage = 'Erreur : ' + (err.error?.message || 'Erreur inconnue')
    });
  }

  addEmail() {
    const emails = this.form.get('allowed_emails') as FormArray;
    emails.push(this.fb.control(''));
  }

  validateQuiz(): string | null {
    if (!this.form.value.title || !this.form.value.title.trim()) {
      return 'Le titre est requis.';
    }

    if (!this.form.value.visibility) {
      return 'La visibilité est requise.';
    }
    
    const questions = this.form.value.questions;
    if (!questions || questions.length === 0) {
      return 'Au moins une question est requise.';
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.content || !q.content.trim()) {
        return 'Chaque question doit avoir un contenu.';
      }

      if (!q.answers || q.answers.length < 2) {
        return 'Chaque question doit avoir au moins deux réponses.';
      }

      const hasCorrect = q.answers.some((a: any) => a.is_correct);
      if (!hasCorrect) {
        return 'Chaque question doit avoir au moins une réponse correcte.';
      }

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].content || !q.answers[j].content.trim()) {
          return 'Chaque réponse doit avoir un contenu.';
        }
      }

      const answerContents = q.answers.map((a: any) => a.content.trim());
      const hasDuplicate = answerContents.some((val: string, idx: number) => answerContents.indexOf(val) !== idx);
      if (hasDuplicate) {
        return 'Chaque réponse d\'une question doit être unique.';
      }
    }
    return null;
  }
}
