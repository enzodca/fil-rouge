import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { QuizListComponent } from './quiz-list.component';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../services/notification/notification.service';
import { AuthService } from '../../../services/auth/auth.service';

class NotificationMock {
  confirm = () => ({ subscribe: (fn: any) => fn(true) });
  showSuccess = jasmine.createSpy('showSuccess');
  showError = jasmine.createSpy('showError');
}

class AuthMock { getUserId = () => 'u1'; getRole = () => 'admin'; }

describe('QuizListComponent (extended)', () => {
  let component: QuizListComponent;
  let fixture: ComponentFixture<QuizListComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: NotificationService, useClass: NotificationMock },
        { provide: AuthService, useClass: AuthMock },
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuizListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  it('charge la liste et supprime un quiz', () => {
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/quiz/all`).flush([ { _id: 'q1', creator_id: { _id: 'u1' } } ]);
    component.deleteQuiz('q1');
    const del = http.expectOne(`${environment.apiUrl}/quiz/q1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({});
  });

  it('canDelete retourne vrai pour admin et créateur', () => {
    component.role = 'user';
    component.userId = 'u1';
    expect(component.canDelete({ creator_id: { _id: 'u1' } })).toBeTrue();
    component.role = 'admin';
    expect(component.canDelete({ creator_id: { _id: 'x' } })).toBeTrue();
    component.role = 'user';
    component.userId = 'u2';
    expect(component.canDelete({ creator_id: { _id: 'u3' } })).toBeFalse();
  });

  it('inviteUser envoie une invitation quand un email est fourni', () => {
    const notif = TestBed.inject(NotificationService) as unknown as NotificationMock;
    spyOn(window, 'prompt').and.returnValue('a@b.com');
    component.inviteUser('q1');
    const req = http.expectOne(`${environment.apiUrl}/quiz/q1/invite`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({});
    expect(notif.showSuccess).toHaveBeenCalled();
  });

  it("inviteUser n'appelle pas l'API quand prompt est annulé", () => {
    spyOn(window, 'prompt').and.returnValue(null as any);
    component.inviteUser('q1');
  http.expectNone(`${environment.apiUrl}/quiz/q1/invite`);
  });

  it('inviteUser gère une erreur HTTP', () => {
    const notif = TestBed.inject(NotificationService) as unknown as NotificationMock;
    spyOn(window, 'prompt').and.returnValue('x@y.z');
    component.inviteUser('q2');
    const req = http.expectOne(`${environment.apiUrl}/quiz/q2/invite`);
    req.flush({ message: 'pas trouvé' }, { status: 404, statusText: 'Not Found' });
    expect(notif.showError).toHaveBeenCalled();
  });

  it('formatTime formate correctement', () => {
    expect(component.formatTime(59)).toBe('59s');
    expect(component.formatTime(61)).toBe('1m 1s');
  });

  it('getTagClass met en lower-case', () => {
    expect(component.getTagClass('Blind_Test')).toBe('blind_test');
  });

  it('getTypeLabel mappe les types connus et retourne le défaut sinon', () => {
    expect(component.getTypeLabel('QCM')).toBe('QCM');
    expect(component.getTypeLabel('ordre')).toBe('Ordre');
    expect(component.getTypeLabel('intrus')).toBe('Intrus');
    expect(component.getTypeLabel('association')).toBe('Association');
    expect(component.getTypeLabel('blind_test')).toBe('Blind Test');
    expect(component.getTypeLabel('inconnu')).toBe('inconnu');
  });
});
