import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';
import { NotificationService } from '../../../services/notification/notification.service';

@Component({
  selector: 'app-play-quiz',
  imports: [SharedModule],
  templateUrl: './play-quiz.component.html',
  styleUrls: ['./play-quiz.component.scss']
})
export class PlayQuizComponent implements OnInit, OnDestroy {
  quizId = '';
  quiz: any = null;
  questions: any[] = [];
  form: FormGroup;
  score: number | null = null;
  currentQuestionIndex = 0;
  showResults = false;
  
  timeRemaining = 0;
  timerInterval: any;
  hasTimer = false;
  totalTime = 0;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('id') || '';
    this.http.get<any>(`${environment.apiUrl}/quiz/${this.quizId}`).subscribe({
      next: data => {
        this.quiz = data;
        this.questions = data.questions;
        this.hasTimer = data.has_timer || false;
        
        if (this.hasTimer) {
          this.timeRemaining = this.questions[0]?.time_limit || 30;
          this.totalTime = data.total_time || 0;
          this.startTimer();
        }
        
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
        this.notification.showError('Quiz introuvable');
        this.router.navigate(['/quiz-list']);
      }
    });
  }

  get currentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  get isLastQuestion() {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  get isFirstQuestion() {
    return this.currentQuestionIndex === 0;
  }

  getAnswersFormArray(questionId: string): FormArray {
    return this.form.get(questionId) as FormArray;
  }

  toggleAnswer(questionId: string, answerIndex: number) {
    const answersArray = this.getAnswersFormArray(questionId);
    const currentValue = answersArray.at(answerIndex).value;
    answersArray.at(answerIndex).setValue(!currentValue);
  }

  selectAnswer(questionId: string, answerContent: string) {
    this.form.get(questionId)?.setValue(answerContent);
  }

  isAnswerSelected(answerIndex: number): boolean {
    if (this.currentQuestion.type === 'QCM') {
      const answersArray = this.getAnswersFormArray(this.currentQuestion._id);
      return answersArray.at(answerIndex).value;
    } else {
      return this.form.get(this.currentQuestion._id)?.value === this.currentQuestion.answers[answerIndex].content;
    }
  }

  hasAnsweredCurrentQuestion(): boolean {
    if (this.currentQuestion.type === 'QCM') {
      const answersArray = this.getAnswersFormArray(this.currentQuestion._id);
      return answersArray.value.some((selected: boolean) => selected);
    } else {
      return this.form.get(this.currentQuestion._id)?.value !== null;
    }
  }

  finishQuiz() {
    this.stopTimer();
    this.calculateScore();
    this.showResults = true;
  }

  calculateScore() {
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

  onSubmit() {
    this.finishQuiz();
  }

  startTimer() {
    if (!this.hasTimer) return;
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.validateCurrentAnswer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetTimerForQuestion() {
    this.stopTimer();
    if (this.hasTimer && this.currentQuestion) {
      this.timeRemaining = this.currentQuestion.time_limit || 30;
      this.startTimer();
    }
  }

  validateCurrentAnswer() {
    this.stopTimer();
    
    if (this.isLastQuestion) {
      this.finishQuiz();
    } else {
      this.currentQuestionIndex++;
      this.resetTimerForQuestion();
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  }

  get timeRemainingPercentage(): number {
    if (!this.hasTimer || !this.currentQuestion) return 100;
    const maxTime = this.currentQuestion.time_limit || 30;
    return (this.timeRemaining / maxTime) * 100;
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}