import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TermsComponent, RouterTestingModule]
    });
  });

  it('goBack navigue vers /register', () => {
    const fixture = TestBed.createComponent(TermsComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    comp.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });
});
