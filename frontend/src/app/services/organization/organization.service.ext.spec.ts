import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrganizationService, Organization } from './organization.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

class AuthMock {
  userId: string | null = 'u1';
  role: string | null = 'user';
  orgId: string | null = 'org1';
  orgName: string | null = 'Org';
  getUserId = () => this.userId;
  getRole = () => this.role;
  getOrganizationId = () => this.orgId;
  getOrganizationName = () => this.orgName;
  hasOrganization = () => !!(this.orgId && this.orgName);
}

describe('OrganizationService (extended)', () => {
  let service: OrganizationService;
  let http: HttpTestingController;
  let auth: AuthMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrganizationService, { provide: AuthService, useClass: AuthMock }]
    });
    service = TestBed.inject(OrganizationService);
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService) as any;
  });

  afterEach(() => http.verify());

  it('createOrganization met à jour l’état et gère le token', () => {
    const resp = { message: 'ok', organization: { _id: 'org2', name: 'New', members: [] } as Organization, token: 't' };
    service.createOrganization('New').subscribe(r => {
      expect(r.organization._id).toBe('org2');
    });
    const req = http.expectOne(`${environment.apiUrl}/organization`);
    expect(req.request.method).toBe('POST');
    req.flush(resp);
    expect(localStorage.getItem('token')).toBe('t');
  });

  it('createOrganization rejette les noms invalides (sync)', (done) => {
    service.createOrganization(' ').subscribe({
      next: () => done.fail('should error'),
      error: (msg) => { expect(msg).toContain('nom'); done(); }
    });
  });

  it('getOrganizationById valide l’ID et appelle le backend', () => {
    service.getOrganizationById('0123456789abcdef01234567').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/organization/0123456789abcdef01234567`);
    expect(req.request.method).toBe('GET');
    req.flush({ _id: 'x', name: 'N', members: [] });
  });

  it('getOrganizationById renvoie une erreur si ID invalide', (done) => {
    service.getOrganizationById('bad').subscribe({
      next: () => done.fail('should error'),
      error: (msg) => { expect(msg).toContain('invalide'); done(); }
    });
  });

  it('inviteToOrganization valide email et ID', () => {
    service.inviteToOrganization('0123456789abcdef01234567', 'a@a.com').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/organization/0123456789abcdef01234567/invite`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'ok' });
  });

  it('updateOrganizationName met à jour l’état utilisateur', () => {
    service.updateOrganizationName('0123456789abcdef01234567', 'Renamed').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/organization/0123456789abcdef01234567`);
    req.flush({ message: 'ok', organization: { _id: '0123456789abcdef01234567', name: 'Renamed', members: [] } });
  });

  it('deleteOrganization supprime et met à jour token', () => {
    service.deleteOrganization('0123456789abcdef01234567').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/organization/0123456789abcdef01234567`);
    req.flush({ message: 'deleted', token: 'newtok' });
    expect(localStorage.getItem('token')).toBe('newtok');
  });

  it('leaveOrganization met à jour token si fourni', () => {
    service.leaveOrganization().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/organization/leave`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'left', token: 't2' });
    expect(localStorage.getItem('token')).toBe('t2');
  });

  it('helpers canManage/canInvite/canUpdateName/canDelete/isChef/canRemoveMember', () => {
    const org: Organization = {
      _id: 'org1',
      name: 'X',
      members: [
        { _id: 'u1', username: 'a', email: 'a@a.com', organization_role: 'chef' },
        { _id: 'u2', username: 'b', email: 'b@b.com', organization_role: 'membre' }
      ]
    };
    expect(service.isChef(org, 'u1')).toBeTrue();
    expect(service.isChef(org, 'u2')).toBeFalse();
    expect(service.canInvite(org)).toBeTrue();
    expect(service.canUpdateName(org)).toBeTrue();
    expect(service.canDelete(org)).toBeTrue();
    expect(service.canRemoveMember(org, 'u2')).toBeTrue();
    expect(service.canRemoveMember(org, 'u1')).toBeFalse();
  });
});
