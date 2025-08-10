import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DonationCancelComponent } from './donation-cancel.component';

describe('DonationCancelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonationCancelComponent, RouterTestingModule]
    });
  });

  it('goHome redirige vers /', () => {
    const fixture = TestBed.createComponent(DonationCancelComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    comp.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('tryAgain redirige vers /donation', () => {
    const fixture = TestBed.createComponent(DonationCancelComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    comp.tryAgain();
    expect(router.navigate).toHaveBeenCalledWith(['/donation']);
  });
});
