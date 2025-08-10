import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { EditQuizComponent } from './edit-quiz.component';

describe('EditQuizComponent', () => {
  let component: EditQuizComponent;
  let fixture: ComponentFixture<EditQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditQuizComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'qid']]) } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validateQuiz couvre plusieurs branches', () => {
    component.form.patchValue({ title: ' ', visibility: 'public' });
    (component as any).questions.clear();
    expect(component.validateQuiz()).toBe('Le titre est requis.');

    component.form.patchValue({ title: 'T' });
    expect(component.validateQuiz()).toBe('Au moins une question est requise.');

    component.addQuestion();
    const q = (component as any).questions.at(0);
    q.patchValue({ content: 'Q', type: 'ordre' });
    const answers = (component as any).getAnswers(0);
    answers.at(0).patchValue({ content: 'A', correct_order: 1 });
    answers.at(1).patchValue({ content: 'B', correct_order: 1 });
    expect(component.validateQuiz()).toContain('ordre unique');

    q.patchValue({ type: 'association' });
    answers.at(0).patchValue({ content: 'L1', association_target: '' });
    answers.at(1).patchValue({ content: 'L2', association_target: 'R2' });
    expect(component.validateQuiz()).toContain('doit avoir un élément associé');
  });
});
