import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateQuizComponent } from './create-quiz.component';

describe('CreateQuizComponent', () => {
  let component: CreateQuizComponent;
  let fixture: ComponentFixture<CreateQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateQuizComponent, HttpClientTestingModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validateQuiz retourne des erreurs pour cas invalides', () => {
    component.form.patchValue({ title: ' ', visibility: 'public' });
    (component as any).questions.clear();
    expect(component.validateQuiz()).toBe("Le titre est requis.");

    component.form.patchValue({ title: 'T' });
    expect(component.validateQuiz()).toBe('Au moins une question est requise.');

    component.addQuestion();
    const q = (component as any).questions.at(0);
    q.patchValue({ content: 'Q', type: 'QCM' });
    const answers = (component as any).getAnswers(0);
    answers.at(0).patchValue({ content: 'A', is_correct: true });
    answers.at(1).patchValue({ content: 'A', is_correct: false });
    expect(component.validateQuiz()).toContain("Chaque réponse d'une question doit être unique.");

    q.patchValue({ type: 'blind_test' });
    answers.at(0).patchValue({ content: 'X', is_correct: true });
    answers.at(1).patchValue({ content: 'Y', is_correct: false });
    expect(component.validateQuiz()).toBe('Chaque question de blind test doit avoir un fichier audio.');
  });
});
