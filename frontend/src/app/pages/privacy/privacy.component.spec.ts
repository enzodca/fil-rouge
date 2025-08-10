import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PrivacyComponent, RouterTestingModule]
    });
  });

  it('goBack navigue vers /register', () => {
    const fixture = TestBed.createComponent(PrivacyComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    comp.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });
});
