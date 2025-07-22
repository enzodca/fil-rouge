import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-edit-quiz',
  imports: [SharedModule],
  templateUrl: './edit-quiz.component.html'
})
export class EditQuizComponent implements OnInit {
  quizId = '';
  form: FormGroup;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: '',
      visibility: 'public',
      allowed_emails: this.fb.array([]),
      questions: this.fb.array([])
    });
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
        this.questions.clear();
        this.allowedEmails.clear();
        for (let q of data.questions) {
          this.addQuestion(q);
        }
        if (data.visibility === 'private' && data.allowed_emails) {
          data.allowed_emails.forEach((e: string) => this.allowedEmails.push(this.fb.control(e)));
        }
      },
      error: err => {
        this.notification.showError('Quiz introuvable');
        this.router.navigate(['/quiz-list']);
      }
    });
  }

  get questions(): FormArray {
    return this.form.get('questions') as FormArray;
  }

  get allowedEmails(): FormArray {
    return this.form.get('allowed_emails') as FormArray;
  }

  getAnswers(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('answers') as FormArray;
  }

  addQuestion(q?: any) {
    const question = this.fb.group({
      content: [q?.content || '', Validators.required],
      type: q?.type || 'QCM',
      answers: this.fb.array(
        (q?.answers && q.answers.length > 0
          ? q.answers.map((a: any) =>
              this.fb.group({
                content: [a.content, Validators.required],
                is_correct: a.is_correct
              })
            )
          : [
              this.fb.group({ content: ['', Validators.required], is_correct: false }),
              this.fb.group({ content: ['', Validators.required], is_correct: false })
            ])
      ),
      _id: q?._id || null
    });
    this.questions.push(question);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  addAnswer(qIndex: number) {
    this.getAnswers(qIndex).push(
      this.fb.group({ content: ['', Validators.required], is_correct: false })
    );
  }

  removeAnswer(qIndex: number, aIndex: number) {
    const answers = this.getAnswers(qIndex);
    if (answers.length > 2) {
      answers.removeAt(aIndex);
    }
  }

  addEmail() {
    this.allowedEmails.push(this.fb.control(''));
  }

  submit() {
    this.errorMessage = '';
    const error = this.validateQuiz();

    if (this.form.invalid || error) {
      this.form.markAllAsTouched();
      if (error) this.errorMessage = error;
      return;
    }

    this.http.put(`${environment.apiUrl}/quiz/${this.quizId}`, this.form.value).subscribe({
      next: () => {
        this.notification.showSuccess('Quiz mis à jour !');
        this.router.navigate(['/quiz-list']);
      },
      error: err => this.errorMessage = 'Erreur : ' + (err.error?.message || 'Erreur inconnue')
    });
  }

  validateQuiz(): string | null {
    const { title, visibility, questions } = this.form.value;

    if (!title || !title.trim()) return 'Le titre est requis.';
    if (!visibility) return 'La visibilité est requise.';
    if (!questions || questions.length === 0) return 'Au moins une question est requise.';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content || !q.content.trim()) return 'Chaque question doit avoir un contenu.';
      if (!q.answers || q.answers.length < 2) return 'Chaque question doit avoir au moins deux réponses.';
      if (!q.answers.some((a: any) => a.is_correct)) return 'Chaque question doit avoir au moins une réponse correcte.';

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].content || !q.answers[j].content.trim()) {
          return 'Chaque réponse doit avoir un contenu.';
        }
      }

      const answerContents = q.answers.map((a: any) => a.content.trim());
      if (answerContents.some((val: string, idx: number) => answerContents.indexOf(val) !== idx)) {
        return "Chaque réponse d'une question doit être unique.";
      }
    }
    return null;
  }
}