import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { PlayQuizComponent } from './play-quiz.component';

describe('PlayQuizComponent', () => {
  let component: PlayQuizComponent;
  let fixture: ComponentFixture<PlayQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayQuizComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'qid']]) } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatTime et timeRemainingPercentage/progressPercentage calculent correctement', () => {
    expect(component.formatTime(5)).toBe('5s');
  (component as any).questions = [{ time_limit: 20 }];
  (component as any).currentQuestionIndex = 0;
  (component as any).hasTimer = true;
  (component as any).timeRemaining = 10;
    expect(component.timeRemainingPercentage).toBe(50);
    (component as any).duration = 10;
    (component as any).currentTime = 5;
    expect(component.progressPercentage).toBe(50);
  });
});
