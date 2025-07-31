import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StripeService } from './stripe.service';
import { environment } from '../../../environments/environment';

describe('StripeService', () => {
  let service: StripeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StripeService]
    });
    service = TestBed.inject(StripeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get public key', () => {
    const mockResponse = {
      success: true,
      publishableKey: 'pk_test_example'
    };

    service.getPublicKey().subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.publishableKey).toBe('pk_test_example');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stripe/public-key`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create checkout session', () => {
    const mockRequest = {
      amount: 50,
      currency: 'eur',
      successUrl: 'http://localhost:4200/success',
      cancelUrl: 'http://localhost:4200/cancel'
    };

    const mockResponse = {
      success: true,
      sessionId: 'cs_test_example',
      url: 'https://checkout.stripe.com/pay/cs_test_example'
    };

    service.createCheckoutSession(mockRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.sessionId).toBe('cs_test_example');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stripe/create-checkout-session`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should create payment intent', () => {
    const mockRequest = {
      amount: 25,
      currency: 'eur'
    };

    const mockResponse = {
      success: true,
      clientSecret: 'pi_test_example_secret',
      paymentIntentId: 'pi_test_example'
    };

    service.createPaymentIntent(mockRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.clientSecret).toBe('pi_test_example_secret');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/stripe/create-payment-intent`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should format amount for stripe', () => {
    expect(service.formatAmountForStripe(25.50)).toBe(2550);
    expect(service.formatAmountForStripe(10)).toBe(1000);
    expect(service.formatAmountForStripe(0.99)).toBe(99);
  });

  it('should format amount from stripe', () => {
    expect(service.formatAmountFromStripe(2550)).toBe(25.50);
    expect(service.formatAmountFromStripe(1000)).toBe(10);
    expect(service.formatAmountFromStripe(99)).toBe(0.99);
  });
});
