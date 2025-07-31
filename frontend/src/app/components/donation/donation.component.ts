import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StripeService, PaymentSessionRequest } from '../../services/stripe/stripe.service';

@Component({
  selector: 'app-donation',
  imports: [SharedModule],
  templateUrl: './donation.component.html',
  styleUrls: ['./donation.component.scss']
})
export class DonationComponent implements OnInit {
  amount: number = 10;
  customAmount: number | null = null;
  isLoading: boolean = false;
  predefinedAmounts: number[] = [5, 10, 25, 50, 100];

  constructor(
    private stripeService: StripeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkStripeConfiguration();
  }

  private async checkStripeConfiguration(): Promise<void> {
    try {
      const response = await this.stripeService.getPublicKey().toPromise();
      if (!response?.success || !response.publishableKey) {
        this.showError('Configuration Stripe manquante');
      }
    } catch (error) {
      console.error('Erreur de configuration Stripe:', error);
      this.showError('Erreur de configuration Stripe');
    }
  }

  selectAmount(amount: number): void {
    this.amount = amount;
    this.customAmount = null;
  }

  useCustomAmount(): void {
    if (this.customAmount && this.customAmount > 0) {
      this.amount = this.customAmount;
    }
  }

  isAmountValid(): boolean {
    return !!(this.amount && this.amount > 0 && this.amount <= 10000);
  }

  async donate(): Promise<void> {
    if (!this.isAmountValid()) {
      this.showError('Veuillez entrer un montant valide (entre 1€ et 10 000€)');
      return;
    }

    this.isLoading = true;

    try {
      const currentUrl = window.location.origin;
      const sessionRequest: PaymentSessionRequest = {
        amount: this.amount,
        currency: 'eur',
        successUrl: `${currentUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${currentUrl}/donation/cancel`,
        metadata: {
          type: 'donation',
          amount: this.amount.toString()
        }
      };

      const response = await this.stripeService.createCheckoutSession(sessionRequest).toPromise();

      if (response?.success && response.sessionId) {
        await this.stripeService.redirectToCheckout(response.sessionId);
      } else {
        throw new Error(response?.message || 'Erreur lors de la création de la session de paiement');
      }

    } catch (error: any) {
      console.error('Erreur lors de la donation:', error);
      this.showError(error.message || 'Une erreur s\'est produite lors du traitement de votre donation');
    } finally {
      this.isLoading = false;
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
