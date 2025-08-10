import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CreateQuizComponent } from './create-quiz.component';
import { NotificationService } from '../../../services/notification/notification.service';
import { AuthService } from '../../../services/auth/auth.service';
import { QuizService } from '../../../services/quiz/quiz.service';

class NotifMock {
  showSuccess = jasmine.createSpy('showSuccess');
  showError = jasmine.createSpy('showError');
}

class AuthMock {
  http = { get: () => of({ organization_id: { name: 'Org' } }) } as any;
  getUserId = () => 'u1';
  getToken = () => 'tok';
  isLoggedIn = () => true;
}

class QuizServiceMock {
  createQuiz = jasmine.createSpy('createQuiz').and.returnValue(of({ ok: true }));
}

describe('CreateQuizComponent (extended)', () => {
  let component: CreateQuizComponent;
  let fixture: ComponentFixture<CreateQuizComponent>;
  let router: Router;
  let quizService: QuizServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateQuizComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: NotificationService, useClass: NotifMock },
        { provide: AuthService, useClass: AuthMock },
        { provide: QuizService, useClass: QuizServiceMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateQuizComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    quizService = TestBed.inject(QuizService) as any;
  });

  it('détecte les doublons gauche/droite et sur l’ensemble', () => {
    const q = (component as any).questions.at(0);
    q.patchValue({ type: 'association' });
    const answers = (component as any).getAnswers(0);
    answers.at(0).patchValue({ content: 'L1', association_target: 'R1' });
    answers.at(1).patchValue({ content: 'l1', association_target: 'r1' });

    expect(component.hasLeftDuplicate(0, 1)).toBeTrue();
    expect(component.hasRightDuplicate(0, 1)).toBeTrue();
    expect(component.hasDuplicatesInQuestion(0)).toBeTrue();
    expect(component.hasAnyDuplicates()).toBeTrue();
  });

  it('onAudioFileSelected rejette type invalide et taille excessive', () => {
    const q = (component as any).questions.at(0);
    q.patchValue({ type: 'blind_test' });

    const notif = TestBed.inject(NotificationService) as unknown as NotifMock;

    const badFile: any = { type: 'text/plain', size: 100, name: 'a.txt' };
    const evt: any = { target: { files: [badFile] } };
    component.onAudioFileSelected(evt, 0);
    expect(notif.showError).toHaveBeenCalled();

    const bigFile: any = { type: 'audio/mp3', size: 11 * 1024 * 1024, name: 'b.mp3' };
    const evt2: any = { target: { files: [bigFile] } };
    component.onAudioFileSelected(evt2, 0);
    expect(notif.showError).toHaveBeenCalledTimes(2);
  });

  it('onAudioFileSelected accepte un audio et removeAudioFile nettoie', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:ok');
    spyOn(URL, 'revokeObjectURL');

    const q = (component as any).questions.at(0);
    q.patchValue({ type: 'blind_test' });

    const file: any = { type: 'audio/mp3', size: 1000, name: 'song.mp3' };
    const evt: any = { target: { files: [file] } };
    component.onAudioFileSelected(evt, 0);

    expect(component.getAudioFileName(0)).toBe('song.mp3');
    expect(component.getAudioUrl(0)).toBe('blob:ok');

    component.removeAudioFile(0);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(component.getAudioFileName(0)).toBe('');
  });

  it('totalTime et formatTime', () => {
    component.form.get('has_timer')?.setValue(true);
    const q0 = (component as any).questions.at(0);
    q0.get('time_limit').setValue(30);
    component.addQuestion();
    const q1 = (component as any).questions.at(1);
    q1.get('time_limit').setValue(40);
    expect(component.totalTime).toBe(70);
    expect(component.formatTime(59)).toBe('59s');
    expect(component.formatTime(61)).toBe('1m 1s');
  });

  it('submit stoppe si hasAnyDuplicates est vrai', async () => {
    spyOn(component, 'hasAnyDuplicates').and.returnValue(true);
    await component.submit();
    expect(component.errorMessage).toContain('doublons');
    expect(quizService.createQuiz).not.toHaveBeenCalled();
  });

  it('submit stoppe si validateQuiz retourne une erreur', async () => {
    spyOn(component, 'hasAnyDuplicates').and.returnValue(false);
    spyOn(component, 'validateQuiz').and.returnValue('err');
    await component.submit();
    expect(component.errorMessage).toBe('err');
    expect(quizService.createQuiz).not.toHaveBeenCalled();
  });

  it('submit happy path (avec blind_test + base64) puis navigation', async () => {
    spyOn(component, 'hasAnyDuplicates').and.returnValue(false);
    spyOn(component, 'validateQuiz').and.returnValue(null);
    spyOn(component as any, 'fileToBase64').and.returnValue(Promise.resolve('BASE64'));

    const q0 = (component as any).questions.at(0);
  q0.patchValue({ type: 'blind_test', content: 'Q' });
    (component as any).getAnswers(0).at(0).patchValue({ content: 'X', is_correct: true });
    (component as any).getAnswers(0).at(1).patchValue({ content: 'Y', is_correct: false });

  component.form.patchValue({ title: 'Titre', visibility: 'public', creator_id: 'u1' });

    (component as any).audioFiles.set(0, { file: { type: 'audio/mp3', name: 'song.mp3' } as any, url: 'blob:u', name: 'song.mp3' });
    spyOn(URL, 'revokeObjectURL');

    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);

    await component.submit();

    expect(quizService.createQuiz).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/accueil']);
  });

  it('submit gère une erreur de fileToBase64', async () => {
    spyOn(component, 'hasAnyDuplicates').and.returnValue(false);
    spyOn(component, 'validateQuiz').and.returnValue(null);
    spyOn(component as any, 'fileToBase64').and.returnValue(Promise.reject('x'));

    const q0 = (component as any).questions.at(0);
  q0.patchValue({ type: 'blind_test', content: 'Q' });
  (component as any).getAnswers(0).at(0).patchValue({ content: 'X', is_correct: true });
  (component as any).getAnswers(0).at(1).patchValue({ content: 'Y', is_correct: false });
  (component as any).audioFiles.set(0, { file: { type: 'audio/mp3', name: 'song.mp3' } as any, url: 'blob:u', name: 'song.mp3' });

  component.form.patchValue({ title: 'Titre', visibility: 'public', creator_id: 'u1' });

    await component.submit();
    expect(component.errorMessage).toBe('Erreur lors du traitement des fichiers audio');
  });

  it('add/remove answer et addEmail/goBack', () => {
    const qIndex = 0;
    const answers = (component as any).getAnswers(qIndex);
    const len0 = answers.length;
    component.addAnswer(qIndex);
    expect(answers.length).toBe(len0 + 1);

    component.removeAnswer(qIndex, answers.length - 1);
    component.removeAnswer(qIndex, answers.length - 2);
    expect(answers.length).toBe(2);

    const lenEmails0 = (component as any).allowedEmails.length;
    component.addEmail();
    expect((component as any).allowedEmails.length).toBe(lenEmails0 + 1);

    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);
    component.goBack();
    expect(navSpy).toHaveBeenCalledWith(['/quiz']);
  });

  it('removeQuestion met à jour les index audioFiles', () => {
    (component as any).audioFiles.set(0, { file: {} as any, url: 'u0', name: 'n0' });
    component.addQuestion();
    (component as any).audioFiles.set(1, { file: {} as any, url: 'u1', name: 'n1' });

    spyOn(URL, 'revokeObjectURL');
    component.removeQuestion(0);
    expect((component as any).audioFiles.get(0)?.url).toBe('u1');
  });
});
