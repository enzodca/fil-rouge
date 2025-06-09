import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-quiz.component.html'
})
export class CreateQuizComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private auth: AuthService) {
    this.form = this.fb.group({
      title: '',
      description: '',
      visibility: 'public',
      allowed_emails: this.fb.array([]),
      questions: this.fb.array([])
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
      content: '',
      type: 'QCM',
      answers: this.fb.array([
        this.fb.group({ content: '', is_correct: false }),
        this.fb.group({ content: '', is_correct: false })
      ])
    });
    this.questions.push(question);
  }

  addAnswer(qIndex: number) {
    const answers = this.questions.at(qIndex).get('answers') as FormArray;
    answers.push(this.fb.group({ content: '', is_correct: false }));
  }

  submit() {
    if (!this.form.value.creator_id) {
      alert('creator_id requis (provisoire, bientôt automatisé)');
      return;
    }

    this.http.post(`${environment.apiUrl}/quiz/create`, this.form.value).subscribe({
      next: () => {
        alert('Quiz créé !');
        this.router.navigate(['/accueil']);
      },
      error: err => alert('Erreur : ' + err.error.message)
    });
  }

  addEmail() {
    const emails = this.form.get('allowed_emails') as FormArray;
    emails.push(this.fb.control(''));
  }
}
