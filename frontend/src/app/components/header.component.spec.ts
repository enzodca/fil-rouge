import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { HeaderComponent } from './header.component';
import { AuthService } from '../services/auth/auth.service';

class AuthServiceMock {
  orgId: string | null = '1';
  orgName: string | null = 'Org';
  hasOrg = true;
  isLoggedIn = jasmine.createSpy().and.returnValue(true);
  getOrganizationId = jasmine.createSpy().and.callFake(() => this.orgId);
  getOrganizationName = jasmine.createSpy().and.callFake(() => this.orgName);
  hasOrganization = jasmine.createSpy().and.callFake(() => this.hasOrg);
  logout = jasmine.createSpy('logout');
  getUsername = jasmine.createSpy().and.returnValue('john');
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigue vers /accueil si connecté, sinon /login', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    component.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/accueil']);
  });

  it('logout appelle le service et redirige', () => {
    const router = TestBed.inject(Router);
    const auth = TestBed.inject(AuthService) as any as AuthServiceMock;
    spyOn(router, 'navigate').and.resolveTo(true);

    component.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
