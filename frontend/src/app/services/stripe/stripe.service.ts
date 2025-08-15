import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

export interface PaymentSessionRequest {
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: any;
}

export interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: any;
}

export interface StripeResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
  url?: string;
  clientSecret?: string;
  paymentIntentId?: string;
  publishableKey?: string;
  session?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private stripe: Stripe | null = null;
  private stripePromise: Promise<Stripe | null>;
  private readonly apiUrl = environment.apiBaseUrl + '/stripe';

  constructor(private http: HttpClient) {
    this.stripePromise = this.initializeStripe();
  }

  private async initializeStripe(): Promise<Stripe | null> {
    try {
      const response = await this.getPublicKey().toPromise();
      if (response?.success && response.publishableKey) {
        this.stripe = await loadStripe(response.publishableKey);
        return this.stripe;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Stripe:', error);
      return null;
    }
  }

  getPublicKey(): Observable<StripeResponse> {
    return this.http.get<StripeResponse>(`${this.apiUrl}/public-key`);
  }

  createCheckoutSession(request: PaymentSessionRequest): Observable<StripeResponse> {
    return this.http.post<StripeResponse>(`${this.apiUrl}/create-checkout-session`, request);
  }

  getPaymentSession(sessionId: string): Observable<StripeResponse> {
    return this.http.get<StripeResponse>(`${this.apiUrl}/session/${sessionId}`);
  }

  createPaymentIntent(request: PaymentIntentRequest): Observable<StripeResponse> {
    return this.http.post<StripeResponse>(`${this.apiUrl}/create-payment-intent`, request);
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await this.stripePromise;
    if (!stripe) {
      throw new Error('Stripe n\'a pas pu être initialisé');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  }

  async confirmPayment(clientSecret: string, cardElement: StripeCardElement): Promise<any> {
    const stripe = await this.stripePromise;
    if (!stripe) {
      throw new Error('Stripe n\'a pas pu être initialisé');
    }

    return await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement
      }
    });
  }

  async createElement(): Promise<StripeElements | null> {
    const stripe = await this.stripePromise;
    if (!stripe) {
      return null;
    }

    return stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0570de',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'Ideal Sans, system-ui, sans-serif',
          spacingUnit: '2px',
          borderRadius: '4px'
        }
      }
    });
  }

  formatAmountForStripe(amount: number): number {
    return Math.round(amount * 100);
  }

  formatAmountFromStripe(amount: number): number {
    return amount / 100;
  }
}
