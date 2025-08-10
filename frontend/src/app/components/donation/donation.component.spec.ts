import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { DonationComponent } from './donation.component';
import { StripeService } from '../../services/stripe/stripe.service';

class StripeServiceMock {
  getPublicKey = jasmine.createSpy().and.returnValue(of({ success: true, publishableKey: 'pk' }));
  createCheckoutSession = jasmine.createSpy().and.returnValue(of({ success: true, sessionId: 'cs' }));
  redirectToCheckout = jasmine.createSpy().and.returnValue(Promise.resolve());
}
class SnackBarMock { open = jasmine.createSpy('open'); }

describe('DonationComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonationComponent],
      providers: [
        { provide: MatSnackBar, useClass: SnackBarMock },
        { provide: StripeService, useClass: StripeServiceMock }
      ]
    });
  });

  it('valide le montant et lance une session de paiement', async () => {
    const fixture = TestBed.createComponent(DonationComponent);
    const comp = fixture.componentInstance;
  fixture.detectChanges();
  const stripe = TestBed.inject(StripeService) as any as StripeServiceMock;

    comp.amount = 20;
    await comp.donate();

    expect(stripe.createCheckoutSession).toHaveBeenCalled();
    expect(stripe.redirectToCheckout).toHaveBeenCalledWith('cs');
  });

  it('affiche une erreur si montant invalide', async () => {
    const fixture = TestBed.createComponent(DonationComponent);
    const comp = fixture.componentInstance;
  fixture.detectChanges();
  const snack = (comp as any).snackBar as MatSnackBar;
  const snackSpy = spyOn(snack, 'open');

    comp.amount = 0;
    await comp.donate();

  expect(snackSpy).toHaveBeenCalled();
  });

  it('gère une erreur de création de session', async () => {
    const fixture = TestBed.createComponent(DonationComponent);
    const comp = fixture.componentInstance;
  fixture.detectChanges();
  const stripe = TestBed.inject(StripeService) as any as StripeServiceMock;
  const snack = (comp as any).snackBar as MatSnackBar;
  const snackSpy = spyOn(snack, 'open');

    stripe.createCheckoutSession.and.returnValue(throwError(() => new Error('boom')));

    comp.amount = 10;
    await comp.donate();

  expect(snackSpy).toHaveBeenCalled();
  });
});
