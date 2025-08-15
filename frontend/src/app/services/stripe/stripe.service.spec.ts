import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StripeService } from './stripe.service';
import { environment } from '../../../environments/environment';

describe('StripeService', () => {
  let service: StripeService;
  let httpMock: HttpTestingController;

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
  TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
  httpMock = TestBed.inject(HttpTestingController);
  service = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });
  expect(service).toBeTruthy();
  });

  it('should get public key', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
    const mockResponse = {
      success: true,
      publishableKey: 'pk_test_example'
    };

    const s = TestBed.inject(StripeService);
  const initReq = httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`);
    initReq.flush({ success: true, publishableKey: 'pk_test_dummy' });

    s.getPublicKey().subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.publishableKey).toBe('pk_test_example');
    });

  const req = httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create checkout session', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
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

  const s = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });

  s.createCheckoutSession(mockRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.sessionId).toBe('cs_test_example');
    });

  const req = httpMock.expectOne(`${environment.apiBaseUrl}/stripe/create-checkout-session`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should create payment intent', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
    const mockRequest = {
      amount: 25,
      currency: 'eur'
    };

    const mockResponse = {
      success: true,
      clientSecret: 'pi_test_example_secret',
      paymentIntentId: 'pi_test_example'
    };

  const s = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });

  s.createPaymentIntent(mockRequest).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.clientSecret).toBe('pi_test_example_secret');
    });

  const req = httpMock.expectOne(`${environment.apiBaseUrl}/stripe/create-payment-intent`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should format amount for stripe', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
    const s = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });
    expect(s.formatAmountForStripe(25.50)).toBe(2550);
    expect(s.formatAmountForStripe(10)).toBe(1000);
    expect(s.formatAmountForStripe(0.99)).toBe(99);
  });

  it('should format amount from stripe', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
    const s = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });
    expect(s.formatAmountFromStripe(2550)).toBe(25.50);
    expect(s.formatAmountFromStripe(1000)).toBe(10);
    expect(s.formatAmountFromStripe(99)).toBe(0.99);
  });

  it('redirectToCheckout throws when Stripe not initialized', async () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
  service = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({}, { status: 500, statusText: 'Err' });
  (service as any).stripePromise = Promise.resolve(null);
  await expectAsync(service.redirectToCheckout('sess_1')).toBeRejectedWithError("Stripe n'a pas pu être initialisé");
  });

  it('redirectToCheckout succeeds and handles provider error', async () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
  service = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });
  const redirectSpy = jasmine.createSpy('redirectToCheckout').and.resolveTo({});
  (service as any).stripePromise = Promise.resolve({ redirectToCheckout: redirectSpy } as any);

  await expectAsync(service.redirectToCheckout('sess_ok')).toBeResolved();

  (service as any).stripePromise = Promise.resolve({ redirectToCheckout: () => Promise.resolve({ error: { message: 'boom' } } as any) } as any);
  await expectAsync(service.redirectToCheckout('sess_ko')).toBeRejectedWithError('boom');
  });

  it('confirmPayment returns result or throws if not initialized', async () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({}, { status: 500, statusText: 'Err' });
    (service as any).stripePromise = Promise.resolve(null);
    await expectAsync(service.confirmPayment('sec', {} as any)).toBeRejectedWithError("Stripe n'a pas pu être initialisé");

    (service as any).stripePromise = Promise.resolve({
      confirmCardPayment: jasmine.createSpy('confirmCardPayment').and.resolveTo({ paymentIntent: { id: 'pi_1' } })
    } as any);
    const res = await service.confirmPayment('sec_2', {} as any);
    expect(res).toEqual({ paymentIntent: { id: 'pi_1' } } as any);
  });

  it('createElement returns null when not initialized, else returns elements', async () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);

  let s = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({}, { status: 500, statusText: 'Err' });
  (s as any).stripePromise = Promise.resolve(null);
  expect(await s.createElement()).toBeNull();

  (s as any).stripePromise = Promise.resolve({ elements: jasmine.createSpy('elements').and.returnValue({ some: 'elements' }) } as any);
  expect(await s.createElement()).toEqual({ some: 'elements' } as any);
  });

  it('getPaymentSession récupère une session', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StripeService] });
    httpMock = TestBed.inject(HttpTestingController);
    const s = TestBed.inject(StripeService);
  httpMock.expectOne(`${environment.apiBaseUrl}/stripe/public-key`).flush({ success: true, publishableKey: 'pk_test_dummy' });
    s.getPaymentSession('sess_123').subscribe(r => {
      expect(r.success).toBeTrue();
      expect(r.session).toEqual({ id: 'sess_123' } as any);
    });
  const req = httpMock.expectOne(`${environment.apiBaseUrl}/stripe/session/sess_123`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, session: { id: 'sess_123' } });
  });
});
