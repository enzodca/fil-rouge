import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../services/stripe/stripe.service';

@Component({
  selector: 'app-donation-success',
  imports: [SharedModule],
  templateUrl: './donation-success.component.html',
  styleUrls: ['./donation-success.component.scss']
})
export class DonationSuccessComponent implements OnInit {
  isLoading = true;
  paymentVerified = false;
  sessionDetails: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stripeService: StripeService
  ) {}

  ngOnInit(): void {
    this.verifyPayment();
  }

  private async verifyPayment(): Promise<void> {
    try {
      const sessionId = this.route.snapshot.queryParams['session_id'];
      
      if (!sessionId) {
        this.isLoading = false;
        return;
      }

      const response = await this.stripeService.getPaymentSession(sessionId).toPromise();
      
      if (response?.success && response.session) {
        this.sessionDetails = response.session;
        this.paymentVerified = response.session.payment_status === 'paid';
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du paiement:', error);
    } finally {
      this.isLoading = false;
    }
  }

  formatAmount(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2);
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Payé';
      case 'unpaid': return 'Non payé';
      case 'no_payment_required': return 'Aucun paiement requis';
      default: return status;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  makeDonation(): void {
    this.router.navigate(['/donation']);
  }
}
