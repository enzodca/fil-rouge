import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { OrganizationComponent } from './organization.component';

describe('OrganizationComponent', () => {
  let component: OrganizationComponent;
  let fixture: ComponentFixture<OrganizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
  { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '123']]) } } },
  { provide: AuthService, useValue: { getUserId: () => '123', getRole: () => 'user' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('helpers de permissions renvoient des booléens cohérents', () => {
    component['organization'] = {
      _id: 'org1',
      name: 'X',
      members: [
        { _id: '123', username: 'chef', email: 'c@x.com', organization_role: 'chef' },
        { _id: 'u2', username: 'm', email: 'm@x.com', organization_role: 'membre' }
      ]
    } as any;
    component['currentUserId'] = '123';
    expect(component.isCurrentUserChef()).toBeTrue();
    expect(component.canInviteMembers()).toBeTrue();
    expect(component.canRemoveMember('u2')).toBeTrue();
    expect(component.canRemoveMember('123')).toBeFalse();
  });
});
