import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { environment } from '../../../../environments/environment';
import { SharedModule } from '../../../shared/shared.module';
import { NotificationService } from '../../../services/notification/notification.service';

@Component({
  selector: 'app-play-quiz',
  imports: [SharedModule],
  templateUrl: './play-quiz.component.html',
  styleUrls: ['./play-quiz.component.scss']
})
export class PlayQuizComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

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

  isPlaying = false;
  volume = 70;
  currentTime = 0;
  duration = 0;
  audioInterval: any;

  orderAnswers: any[] = [];

  associationPairs: { left: any, right: any, matched: boolean }[] = [];
  selectedLeftItem: any = null;
  shuffledRightItems: string[] = [];

  Object = Object;

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
          } else if (q.type === 'ordre') {
            this.form.addControl(q._id, this.fb.control([]));
          } else if (q.type === 'association') {
            this.form.addControl(q._id, this.fb.control({}));
          } else if (q.type === 'blind_test') {
            this.form.addControl(q._id, this.fb.control(null));
          } else {
            this.form.addControl(q._id, this.fb.control(null));
          }
        }

        this.initializeOrderAnswers();
        this.initializeAssociationAnswers();
      },
      error: () => {
        this.notification.showError('Quiz introuvable');
        this.router.navigate(['/quiz-list']);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeAudio();
    }, 100);
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

  initializeOrderAnswers() {
    if (this.currentQuestion && this.currentQuestion.type === 'ordre') {
      this.orderAnswers = [...this.currentQuestion.answers].sort(() => Math.random() - 0.5);
      this.form.get(this.currentQuestion._id)?.setValue([...this.orderAnswers]);
    }
  }

  initializeAssociationAnswers() {
    if (this.currentQuestion && this.currentQuestion.type === 'association') {
      this.shuffledRightItems = [...this.currentQuestion.answers.map((a: any) => a.association_target)]
        .sort(() => Math.random() - 0.5);

      this.selectedLeftItem = null;

      this.form.get(this.currentQuestion._id)?.setValue({});
    }
  }

  onDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.orderAnswers, event.previousIndex, event.currentIndex);
    this.form.get(this.currentQuestion._id)?.setValue([...this.orderAnswers]);
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

  selectLeftItem(item: any) {
    this.selectedLeftItem = item;
  }

  associateWithRight(rightItem: string) {
    if (!this.selectedLeftItem) return;

    const currentValue = this.form.get(this.currentQuestion._id)?.value || {};
    currentValue[this.selectedLeftItem.content] = rightItem;
    this.form.get(this.currentQuestion._id)?.setValue(currentValue);

    this.selectedLeftItem = null;
  }

  isLeftItemSelected(item: any): boolean {
    return this.selectedLeftItem === item;
  }

  getAssociationForLeft(leftContent: string): string | null {
    const associations = this.form.get(this.currentQuestion._id)?.value || {};
    return associations[leftContent] || null;
  }

  isRightItemUsed(rightItem: string): boolean {
    const associations = this.form.get(this.currentQuestion._id)?.value || {};
    return Object.values(associations).includes(rightItem);
  }

  getForm(questionId: string) {
    return this.form.get(questionId);
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
    } else if (this.currentQuestion.type === 'ordre') {
      return this.orderAnswers.length > 0;
    } else if (this.currentQuestion.type === 'association') {
      const associations = this.form.get(this.currentQuestion._id)?.value || {};
      return Object.keys(associations).length === this.currentQuestion.answers.length;
    } else if (this.currentQuestion.type === 'blind_test') {
      return this.form.get(this.currentQuestion._id)?.value !== null;
    } else {
      return this.form.get(this.currentQuestion._id)?.value !== null;
    }
  }

  getAudioUrl(question: any): string {
    if (question && question.audio_url) {
      return `${environment.apiUrl.replace('/api', '')}${question.audio_url}`;
    }
    return '';
  }

  playAudio(): void {
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.play();
    }
  }

  pauseAudio(): void {
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.pause();
    }
  }

  restartAudio(): void {
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.currentTime = 0;
      this.audioPlayer.nativeElement.play();
    }
  }

  togglePlayPause(): void {
    if (!this.audioPlayer?.nativeElement) return;
    
    if (this.audioPlayer.nativeElement.paused) {
      this.audioPlayer.nativeElement.play();
      this.isPlaying = true;
    } else {
      this.audioPlayer.nativeElement.pause();
      this.isPlaying = false;
    }
  }

  onVolumeChange(event: any): void {
    if (this.audioPlayer?.nativeElement) {
      this.volume = event.target.value;
      this.audioPlayer.nativeElement.volume = this.volume / 100;
    }
  }

  formatAudioTime(time: number): string {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  initializeAudio(): void {
    if (!this.audioPlayer?.nativeElement) return;
    
    const audio = this.audioPlayer.nativeElement;

    audio.addEventListener('loadedmetadata', () => {
      this.duration = audio.duration;
    });
    
    audio.addEventListener('timeupdate', () => {
      this.currentTime = audio.currentTime;
    });
    
    audio.addEventListener('play', () => {
      this.isPlaying = true;
    });
    
    audio.addEventListener('pause', () => {
      this.isPlaying = false;
    });
    
    audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentTime = 0;
    });
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
      } else if (question.type === 'ordre') {
        const userOrder = this.form.value[question._id];
        const correctOrder = [...question.answers].sort((a, b) => a.correct_order - b.correct_order);

        const isCorrect = userOrder.length === correctOrder.length &&
          userOrder.every((answer: any, index: number) =>
            answer._id === correctOrder[index]._id
          );

        if (isCorrect) total++;
      } else if (question.type === 'association') {
        const userAssociations = this.form.value[question._id] || {};
        let correctAssociations = 0;

        for (const answer of question.answers) {
          if (userAssociations[answer.content] === answer.association_target) {
            correctAssociations++;
          }
        }

        if (correctAssociations === question.answers.length) total++;
      } else if (question.type === 'blind_test') {
        const selected = this.form.value[question._id];
        const correct = question.answers.find((a: any) => a.is_correct)?.content;
        if (selected === correct) total++;
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

    if (this.currentQuestion.type === 'blind_test') {
      this.pauseAudio();
    }

    if (this.isLastQuestion) {
      this.finishQuiz();
    } else {
      this.currentQuestionIndex++;
      this.initializeOrderAnswers();
      this.initializeAssociationAnswers();
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

  get progressPercentage(): number {
    if (this.duration === 0) return 0;
    return (this.currentTime / this.duration) * 100;
  }

  ngOnDestroy() {
    this.stopTimer();
    if (this.audioPlayer?.nativeElement) {
      this.audioPlayer.nativeElement.pause();
    }
    if (this.audioInterval) {
      clearInterval(this.audioInterval);
    }
  }
}