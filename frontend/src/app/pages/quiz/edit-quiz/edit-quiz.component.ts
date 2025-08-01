import { Component, OnInit, OnDestroy } from '@angular/core';
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
  templateUrl: './edit-quiz.component.html',
  styleUrls: ['./edit-quiz.component.scss'],
})
export class EditQuizComponent implements OnInit, OnDestroy {
  quizId = '';
  form: FormGroup;
  errorMessage = '';
  audioFiles = new Map<number, { file: File; url: string; name: string }>();
  hasOrganization = false;
  organizationName: string | null = null;

  get hasTimer(): boolean {
    return this.form.get('has_timer')?.value || false;
  }

  get totalTime(): number {
    if (!this.hasTimer) return 0;
    return this.questions.controls.reduce((total, question) => {
      const timeLimit = question.get('time_limit')?.value || 30;
      return total + timeLimit;
    }, 0);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

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
      questions: this.fb.array([]),
      has_timer: false
    });
  }

  ngOnInit() {
    this.quizId = this.route.snapshot.paramMap.get('id') || '';
    
    this.auth.getToken() && this.auth.isLoggedIn()
      ? this.authUserInfo()
      : null;
    
    this.http.get<any>(`${environment.apiUrl}/quiz/${this.quizId}`).subscribe({
      next: data => {
        this.form.patchValue({
          title: data.title,
          description: data.description,
          visibility: data.visibility || 'public',
          has_timer: data.has_timer || false
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
    return this.http.get<any>(`${environment.apiUrl}/auth/me`);
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

  getQuestionType(questionIndex: number): string {
    return this.questions.at(questionIndex).get('type')?.value || 'QCM';
  }

  hasLeftDuplicate(questionIndex: number, answerIndex: number): boolean {
    const answers = this.getAnswers(questionIndex);
    const currentValue = answers.at(answerIndex).get('content')?.value?.trim().toLowerCase();
    if (!currentValue) return false;
    
    for (let i = 0; i < answers.length; i++) {
      if (i !== answerIndex) {
        const otherValue = answers.at(i).get('content')?.value?.trim().toLowerCase();
        if (otherValue === currentValue) {
          return true;
        }
      }
    }
    return false;
  }

  hasRightDuplicate(questionIndex: number, answerIndex: number): boolean {
    const answers = this.getAnswers(questionIndex);
    const currentValue = answers.at(answerIndex).get('association_target')?.value?.trim().toLowerCase();
    if (!currentValue) return false;
    
    for (let i = 0; i < answers.length; i++) {
      if (i !== answerIndex) {
        const otherValue = answers.at(i).get('association_target')?.value?.trim().toLowerCase();
        if (otherValue === currentValue) {
          return true;
        }
      }
    }
    return false;
  }

  hasDuplicatesInQuestion(questionIndex: number): boolean {
    if (this.getQuestionType(questionIndex) !== 'association') return false;
    
    const answers = this.getAnswers(questionIndex);
    for (let i = 0; i < answers.length; i++) {
      if (this.hasLeftDuplicate(questionIndex, i) || this.hasRightDuplicate(questionIndex, i)) {
        return true;
      }
    }
    return false;
  }

  hasAnyDuplicates(): boolean {
    for (let i = 0; i < this.questions.length; i++) {
      if (this.hasDuplicatesInQuestion(i)) {
        return true;
      }
    }
    return false;
  }

  addAnswer(qIndex: number) {
    this.getAnswers(qIndex).push(
      this.fb.group({ 
        content: ['', Validators.required], 
        is_correct: false,
        correct_order: [0],
        association_target: ['']
      })
    );
  }

  onAudioFileSelected(event: any, questionIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        this.notification.showError('Veuillez sélectionner un fichier audio valide.');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        this.notification.showError('Le fichier audio ne doit pas dépasser 10MB.');
        return;
      }
      
      const url = URL.createObjectURL(file);
      
      this.audioFiles.set(questionIndex, {
        file: file,
        url: url,
        name: file.name
      });
      
      this.questions.at(questionIndex).patchValue({
        audio_file_name: file.name
      });
    }
  }

  removeAudioFile(questionIndex: number): void {
    const audioData = this.audioFiles.get(questionIndex);
    if (audioData) {
      URL.revokeObjectURL(audioData.url);
      this.audioFiles.delete(questionIndex);
    }
    
    this.questions.at(questionIndex).patchValue({
      audio_file_name: null,
      audio_url: null,
      audio_data: null,
      audio_mimetype: null
    });
  }

  getAudioFileName(questionIndex: number): string {
    const audioData = this.audioFiles.get(questionIndex);
    if (audioData) {
      return audioData.name;
    }
    const question = this.questions.at(questionIndex);
    return question.get('audio_file_name')?.value || '';
  }

  getAudioUrl(questionIndex: number): string {
    const audioData = this.audioFiles.get(questionIndex);
    if (audioData) {
      return audioData.url;
    }
    const question = this.questions.at(questionIndex);
    return question.get('audio_url')?.value || '';
  }

  hasAudioFile(questionIndex: number): boolean {
    return this.getAudioFileName(questionIndex) !== '';
  }

  removeQuestion(index: number) {
    this.removeAudioFile(index);
    this.questions.removeAt(index);

    const newAudioFiles = new Map<number, { file: File; url: string; name: string }>();
    this.audioFiles.forEach((value, key) => {
      if (key > index) {
        newAudioFiles.set(key - 1, value);
      } else if (key < index) {
        newAudioFiles.set(key, value);
      }
    });
    this.audioFiles = newAudioFiles;
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

  addQuestion(q?: any) {
    const question = this.fb.group({
      content: [q?.content || '', Validators.required],
      type: q?.type || 'QCM',
      time_limit: [q?.time_limit || 30, [Validators.required, Validators.min(5), Validators.max(300)]],
      answers: this.fb.array(
        (q?.answers && q.answers.length > 0
          ? q.answers.map((a: any) =>
              this.fb.group({
                content: [a.content, Validators.required],
                is_correct: a.is_correct,
                correct_order: [a.correct_order || 0],
                association_target: [a.association_target || '']
              })
            )
          : [
              this.fb.group({ 
                content: ['', Validators.required], 
                is_correct: false,
                correct_order: [0],
                association_target: ['']
              }),
              this.fb.group({ 
                content: ['', Validators.required], 
                is_correct: false,
                correct_order: [0],
                association_target: ['']
              })
            ])
      ),
      _id: q?._id || null,
      audio_file_name: q?.audio_file_name || null,
      audio_url: q?.audio_url || null,
      audio_data: q?.audio_data || null,
      audio_mimetype: q?.audio_mimetype || null
    });
    this.questions.push(question);
  }

  async submit() {
    this.errorMessage = '';
    
    if (this.hasAnyDuplicates()) {
      this.errorMessage = 'Veuillez corriger les doublons dans les questions d\'association avant de continuer.';
      return;
    }
    
    const error = this.validateQuiz();

    if (this.form.invalid || error) {
      this.form.markAllAsTouched();
      if (error) this.errorMessage = error;
      return;
    }

    try {
      const quizData = { ...this.form.value };

      for (let questionIndex = 0; questionIndex < quizData.questions.length; questionIndex++) {
        const audioData = this.audioFiles.get(questionIndex);
        if (audioData && quizData.questions[questionIndex].type === 'blind_test') {
          const base64 = await this.fileToBase64(audioData.file);
          quizData.questions[questionIndex].audio_data = base64;
          quizData.questions[questionIndex].audio_mimetype = audioData.file.type;
          quizData.questions[questionIndex].audio_file_name = audioData.file.name;
        }
      }

      this.http.put(`${environment.apiUrl}/quiz/${this.quizId}`, quizData).subscribe({
        next: () => {
          this.audioFiles.forEach((audioData) => {
            URL.revokeObjectURL(audioData.url);
          });
          this.audioFiles.clear();
          
          this.notification.showSuccess('Quiz mis à jour !');
          this.router.navigate(['/quiz-list']);
        },
        error: err => this.errorMessage = 'Erreur : ' + (err.error?.message || 'Erreur inconnue')
      });
    } catch (error) {
      this.errorMessage = 'Erreur lors du traitement des fichiers audio';
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
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

      if (q.type === 'ordre') {
        const orders = q.answers.map((a: any) => a.correct_order);
        const uniqueOrders = [...new Set(orders)];
        if (uniqueOrders.length !== q.answers.length) {
          return 'Chaque réponse d\'une question d\'ordre doit avoir un ordre unique.';
        }
        for (let order of orders) {
          if (order < 1 || order > q.answers.length) {
            return `L'ordre des réponses doit être entre 1 et ${q.answers.length}.`;
          }
        }
      } else if (q.type === 'association') {
        for (let j = 0; j < q.answers.length; j++) {
          if (!q.answers[j].association_target || !q.answers[j].association_target.trim()) {
            return 'Chaque élément d\'association doit avoir un élément associé.';
          }
        }
        
        const leftContents = q.answers.map((a: any) => a.content.trim().toLowerCase());
        const uniqueLeftContents = [...new Set(leftContents)];
        if (uniqueLeftContents.length !== q.answers.length) {
          return 'Les éléments de gauche ne peuvent pas être identiques dans une question d\'association.';
        }

        const rightContents = q.answers.map((a: any) => a.association_target.trim().toLowerCase());
        const uniqueRightContents = [...new Set(rightContents)];
        if (uniqueRightContents.length !== q.answers.length) {
          return 'Les éléments de droite ne peuvent pas être identiques dans une question d\'association.';
        }
      } else if (q.type === 'blind_test') {
        if (!this.hasAudioFile(i)) {
          return 'Chaque question de blind test doit avoir un fichier audio.';
        }

        if (!q.answers.some((a: any) => a.is_correct)) {
          return 'Chaque question de blind test doit avoir au moins une réponse correcte.';
        }
      } else {
        if (!q.answers.some((a: any) => a.is_correct)) {
          return 'Chaque question doit avoir au moins une réponse correcte.';
        }
      }

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

  goBack(): void {
    this.router.navigate(['/quiz']);
  }

  ngOnDestroy(): void {
    this.audioFiles.forEach((audioData) => {
      URL.revokeObjectURL(audioData.url);
    });
    this.audioFiles.clear();
  }
}