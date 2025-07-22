import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { QuizService } from '../../../services/quiz/quiz.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-create-quiz',
  imports: [SharedModule],
  templateUrl: './create-quiz.component.html',
})
export class CreateQuizComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  hasOrganization = false;
  organizationName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private quizService: QuizService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: '',
      visibility: 'public',
      allowed_emails: this.fb.array([]),
      questions: this.fb.array([]),
      creator_id: '',
    });
    this.addQuestion();
  }

  ngOnInit(): void {
    const id = this.auth.getUserId();
    if (id) {
      this.form.get('creator_id')?.setValue(id);
      this.auth.getToken() && this.auth.isLoggedIn()
        ? this.authUserInfo()
        : this.handleNotConnected();
    } else {
      this.handleNotConnected();
    }
  }

  private authUserInfo() {
    this.authMe().subscribe({
      next: (user) => {
        this.hasOrganization = !!user.organization_id;
        this.organizationName = user.organization_id?.name || null;
      },
      error: () => {
        this.hasOrganization = false;
      },
    });
  }

  private authMe() {
    return this.auth['http'].get<any>(`${environment.apiUrl}/auth/me`);
  }

  private handleNotConnected() {
    this.notification.showError('Non connecté !');
    this.router.navigate(['/login']);
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

  addQuestion() {
    const question = this.fb.group({
      content: ['', Validators.required],
      type: 'QCM',
      answers: this.fb.array([
        this.fb.group({
          content: ['', Validators.required],
          is_correct: false,
        }),
        this.fb.group({
          content: ['', Validators.required],
          is_correct: false,
        }),
      ]),
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

    this.quizService.createQuiz(this.form.value).subscribe({
      next: () => {
        this.notification.showSuccess('Quiz créé !');
        this.router.navigate(['/accueil']);
      },
      error: (err) =>
        (this.errorMessage =
          'Erreur : ' + (err.error?.message || 'Erreur inconnue')),
    });
  }

  validateQuiz(): string | null {
    const { title, visibility, questions } = this.form.value;

    if (!title || !title.trim()) return 'Le titre est requis.';
    if (!visibility) return 'La visibilité est requise.';
    if (!questions || questions.length === 0)
      return 'Au moins une question est requise.';

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content || !q.content.trim())
        return 'Chaque question doit avoir un contenu.';
      if (!q.answers || q.answers.length < 2)
        return 'Chaque question doit avoir au moins deux réponses.';
      if (!q.answers.some((a: any) => a.is_correct))
        return 'Chaque question doit avoir au moins une réponse correcte.';

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].content || !q.answers[j].content.trim()) {
          return 'Chaque réponse doit avoir un contenu.';
        }
      }

      const answerContents = q.answers.map((a: any) => a.content.trim());
      if (
        answerContents.some(
          (val: string, idx: number) => answerContents.indexOf(val) !== idx
        )
      ) {
        return "Chaque réponse d'une question doit être unique.";
      }
    }
    return null;
  }
}
