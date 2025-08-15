import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { QuizLeaderboardComponent } from './quiz-leaderboard.component';
import { NotificationService } from '../../../services/notification/notification.service';
import { environment } from '../../../../environments/environment';

class NotifMock { showError = jasmine.createSpy('showError'); }

describe('QuizLeaderboardComponent', () => {
  let component: QuizLeaderboardComponent;
  let fixture: ComponentFixture<QuizLeaderboardComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuizLeaderboardComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'qid']]) } } },
        { provide: NotificationService, useClass: NotifMock }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuizLeaderboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => http.verify());

  it('charge le leaderboard et formate des valeurs', () => {
    fixture.detectChanges();
  const req = http.expectOne(`${environment.apiBaseUrl}/quiz/qid/leaderboard`);
    req.flush({ quiz: { _id: 'qid' }, leaderboard: [{ position: 1 }], total_participants: 3 });

    expect(component.quiz._id).toBe('qid');
    expect(component.loading).toBeFalse();
    expect(component.getPositionClass(1)).toBe('gold');
    expect(component.getPositionClass(4)).toBe('');
    expect(component.getPositionIcon(1)).toBe('emoji_events');
    expect(component.getPositionIcon(4)).toBe('person');
    expect(component.formatTime(59)).toBe('59s');
    expect(component.formatTime(61)).toBe('1min 1s');
  });

  it('gère l\'erreur de chargement', () => {
    fixture.detectChanges();
  const req = http.expectOne(`${environment.apiBaseUrl}/quiz/qid/leaderboard`);
    req.flush({}, { status: 500, statusText: 'Err' });
    expect(component.loading).toBeFalse();
  });
});
