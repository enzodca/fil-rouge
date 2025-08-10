import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QuizService } from './quiz.service';
import { environment } from '../../../environments/environment';

describe('QuizService (extended)', () => {
  let service: QuizService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(QuizService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getStats récupère les stats', () => {
    const mock = { totalQuizzes: 1, totalUsers: 2, totalGamesPlayed: 3 };
    service.getStats().subscribe(res => {
      expect(res).toEqual(mock);
    });
    const req = http.expectOne(`${environment.apiUrl}/quiz/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('createQuiz envoie le payload', () => {
    const payload = { title: 'T', questions: [] } as any;
    service.createQuiz(payload).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/quiz/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
