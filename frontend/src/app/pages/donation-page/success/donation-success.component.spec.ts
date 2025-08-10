import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { DonationSuccessComponent } from './donation-success.component';
import { StripeService } from '../../../services/stripe/stripe.service';
import { ActivatedRoute } from '@angular/router';

class StripeServiceMock {
  getPaymentSession = jasmine.createSpy().and.returnValue(of({ success: true, session: { payment_status: 'paid', amount_total: 500 } }));
}


describe('DonationSuccessComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonationSuccessComponent, RouterTestingModule],
      providers: [
        { provide: StripeService, useClass: StripeServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { session_id: 'cs' } } } }
      ]
    });
  });

  it('vérifie le paiement au init et met à jour l\'état', async () => {
    const fixture = TestBed.createComponent(DonationSuccessComponent);
    const comp = fixture.componentInstance;

    await comp.ngOnInit();
    expect(comp.paymentVerified).toBeTrue();
    expect(comp.sessionDetails).toBeTruthy();
  });

  it('formatAmount convertit correctement', () => {
    expect(new DonationSuccessComponent({} as any, {} as any, {} as any).formatAmount(1234)).toBe('12.34');
  });
});
