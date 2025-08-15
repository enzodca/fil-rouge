import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { PlayQuizComponent } from './play-quiz.component';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from '../../../services/notification/notification.service';
import { environment } from '../../../../environments/environment';

class NotifMock {
  showSuccess = jasmine.createSpy('showSuccess');
  showError = jasmine.createSpy('showError');
  showInfo = jasmine.createSpy('showInfo');
}

describe('PlayQuizComponent (extended)', () => {
  let component: PlayQuizComponent;
  let fixture: ComponentFixture<PlayQuizComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayQuizComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'qid']]) } } },
        { provide: NotificationService, useClass: NotifMock }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PlayQuizComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    http.verify();
  });

  function setupQuestions(fb: FormBuilder) {
    const qcm = {
      _id: 'q1',
      type: 'QCM',
      answers: [
        { content: 'A', is_correct: true },
        { content: 'B', is_correct: false }
      ]
    } as any;
    const ordre = {
      _id: 'q2',
      type: 'ordre',
      answers: [
        { _id: 'a1', correct_order: 1 },
        { _id: 'a2', correct_order: 2 }
      ]
    } as any;
    const association = {
      _id: 'q3',
      type: 'association',
      answers: [
        { content: 'L1', association_target: 'R1' },
        { content: 'L2', association_target: 'R2' }
      ]
    } as any;
    const blind = {
      _id: 'q4',
      type: 'blind_test',
      answers: [
        { content: 'Song', is_correct: true },
        { content: 'Other', is_correct: false }
      ]
    } as any;

    component.questions = [qcm, ordre, association, blind];
    component.form.addControl(qcm._id, fb.array([fb.control(true), fb.control(false)]));
    component.form.addControl(ordre._id, fb.control([{ _id: 'a1' }, { _id: 'a2' }]));
    component.form.addControl(association._id, fb.control({ L1: 'R1', L2: 'R2' }));
    component.form.addControl(blind._id, fb.control('Song'));
  }

  it('calculateScore calcule le score pour QCM/ordre/association/blind_test', () => {
    setupQuestions(TestBed.inject(FormBuilder));
    component.calculateScore();
    expect(component.score).toBe(4);

    component.form.get('q3')?.setValue({ L1: 'R1', L2: 'X' });
    component.calculateScore();
    expect(component.score).toBe(3);
  });

  it('sélection et association: toggle/select/isAnswerSelected/association helpers', () => {
    const fb = TestBed.inject(FormBuilder);
    const qcm = { _id: 'q1', type: 'QCM', answers: [{}, {}] } as any;
    component.questions = [qcm];
    component.currentQuestionIndex = 0;
    component.form.addControl('q1', fb.array([fb.control(false), fb.control(false)]));
    component.toggleAnswer('q1', 1);
    expect(component.isAnswerSelected(1)).toBeTrue();

    const single = { _id: 'q5', type: 'single', answers: [{ content: 'X' }, { content: 'Y' }] } as any;
    component.questions = [single];
    component.currentQuestionIndex = 0;
    component.form.addControl('q5', fb.control(null));
    component.selectAnswer('q5', 'Y');
    expect(component.isAnswerSelected(1)).toBeTrue();

    const association = { _id: 'q3', type: 'association', answers: [{ content: 'L1' }, { content: 'L2' }] } as any;
    component.questions = [association];
    component.currentQuestionIndex = 0;
    component.form.addControl('q3', fb.control({}));
    component.selectLeftItem({ content: 'L1' });
    component.associateWithRight('R1');
    expect(component.getAssociationForLeft('L1')).toBe('R1');
    expect(component.isRightItemUsed('R1')).toBeTrue();
    expect(component.isLeftItemSelected({ content: 'L1' })).toBeFalse();
  });

  it('initializeOrderAnswers et initializeAssociationAnswers définissent les valeurs', () => {
    const fb = TestBed.inject(FormBuilder);
    const ordre = { _id: 'q2', type: 'ordre', answers: [{ _id: 'a1' }, { _id: 'a2' }] } as any;
    const association = { _id: 'q3', type: 'association', answers: [{ content: 'L1', association_target: 'R1' }] } as any;
    component.questions = [ordre];
    component.currentQuestionIndex = 0;
    component.form.addControl('q2', fb.control([]));
    component.initializeOrderAnswers();
    expect(component.orderAnswers.length).toBe(2);
    expect(component.getForm('q2')?.value.length).toBe(2);

    component.questions = [association];
    component.currentQuestionIndex = 0;
    component.form.addControl('q3', fb.control(null));
    component.initializeAssociationAnswers();
    expect(component.getForm('q3')?.value).toEqual({});
  });

  it('getAudioUrl retourne data URL ou URL absolue basée sur environment', () => {
    const dataQ = { audio_url: 'data:audio/mp3;base64,xxx' } as any;
    expect(component.getAudioUrl(dataQ)).toBe('data:audio/mp3;base64,xxx');
    const pathQ = { audio_url: '/files/a.mp3' } as any;
  const base = environment.apiBaseUrl.replace('/api', '');
    expect(component.getAudioUrl(pathQ)).toBe(base + '/files/a.mp3');
    expect(component.getAudioUrl(null as any)).toBe('');
  });

  it('validateCurrentAnswer avance ou termine selon l’index et pause audio pour blind_test', () => {
    spyOn(component, 'initializeOrderAnswers');
    spyOn(component, 'initializeAssociationAnswers');
    spyOn(component, 'initializeAudioForNewQuestion');
    spyOn(component, 'resetTimerForQuestion');
    spyOn(component, 'pauseAudio');

    component.questions = [{ type: 'blind_test' }, { type: 'QCM' }] as any;
    component.currentQuestionIndex = 0;
    component.hasTimer = true;
    component.timeRemaining = 5;
    component.validateCurrentAnswer();
    expect(component.pauseAudio).toHaveBeenCalled();
    expect(component.currentQuestionIndex).toBe(1);
    expect(component.resetTimerForQuestion).toHaveBeenCalled();

    component.currentQuestionIndex = 1;
    spyOn(component, 'finishQuiz');
    component.validateCurrentAnswer();
    expect(component.finishQuiz).toHaveBeenCalled();
  });

  it('startTimer déclenche validateCurrentAnswer quand le temps expire', () => {
    jasmine.clock().install();
    component.hasTimer = true;
    component.questions = [{ time_limit: 1 }] as any;
    component.currentQuestionIndex = 0;
    component.timeRemaining = 1;
    spyOn(component, 'validateCurrentAnswer');
    component.startTimer();
    jasmine.clock().tick(1000);
    expect(component.validateCurrentAnswer).toHaveBeenCalled();
    component.stopTimer();
    jasmine.clock().uninstall();
  });

  it('ngOnDestroy stoppe timer et pause l’audio', () => {
    component.timerInterval = setInterval(() => {}, 1000);
    (component as any).audioInterval = setInterval(() => {}, 1000);
    component.audioPlayer = {
      nativeElement: {
        pause: jasmine.createSpy('pause')
      }
    } as any;
    component.ngOnDestroy();
    expect(component.timerInterval).toBeNull();
    expect(component.audioPlayer.nativeElement.pause).toHaveBeenCalled();
  });

  it('submitResult appelle l’API et notifie selon isFirstAttempt', () => {
    const notif = TestBed.inject(NotificationService) as unknown as NotifMock;
    component.quizId = 'qid';
    component.questions = [{}, {}] as any;
    component.score = 2;
    component.submitResult(12);
  const req1 = http.expectOne(`${environment.apiBaseUrl}/quiz/result`);
    expect(req1.request.method).toBe('POST');
    req1.flush({ isFirstAttempt: true });
    expect(notif.showSuccess).toHaveBeenCalled();

    component.submitResult(13);
  const req2 = http.expectOne(`${environment.apiBaseUrl}/quiz/result`);
    req2.flush({ isFirstAttempt: false });
    expect(notif.showInfo).toHaveBeenCalled();
  });
});
