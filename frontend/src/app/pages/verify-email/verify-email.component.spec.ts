import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { ActivatedRoute } from '@angular/router';

class AuthServiceMock {
  verifyEmail = jasmine.createSpy().and.returnValue(of({ message: 'ok' }));
  resendVerificationEmail = jasmine.createSpy().and.returnValue(of({ message: 'sent' }));
}
class NotificationServiceMock {
  showSuccess = jasmine.createSpy('showSuccess');
  showError = jasmine.createSpy('showError');
}


describe('VerifyEmailComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: NotificationService, useClass: NotificationServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { token: 't' } } } }
      ]
    });
  });

  it('succès: affiche message et redirige après délai', fakeAsync(() => {
    const fixture = TestBed.createComponent(VerifyEmailComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    comp.ngOnInit();
    tick(3000);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('erreur: affiche showError', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { verifyEmail: () => throwError(() => ({ error: { message: 'bad' } })) } },
        { provide: NotificationService, useClass: NotificationServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: { token: 't' } } } }
      ]
    });
    const fixture = TestBed.createComponent(VerifyEmailComponent);
    const comp = fixture.componentInstance;
    const notif = TestBed.inject(NotificationService) as any as NotificationServiceMock;

    comp.ngOnInit();
    expect(notif.showError).toHaveBeenCalled();
  });
});
