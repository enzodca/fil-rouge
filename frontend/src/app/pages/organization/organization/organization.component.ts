import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { OrganizationService, Organization } from '../../../services/organization/organization.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-organization',
  imports: [SharedModule],
  templateUrl: './organization.component.html'
})
export class OrganizationComponent implements OnInit {
  organization: Organization | null = null;
  isLoading = true;
  error = '';
  inviteEmail = '';
  newName = '';
  
  canManage = false;
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private organizationService: OrganizationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId() || '';
    
    const orgId = this.route.snapshot.paramMap.get('id');
    
    if (orgId) {
      this.loadOrganization(orgId);
    } else {
      this.loadMyOrganization();
    }
  }

  private loadOrganization(id: string): void {
    this.organizationService.getOrganizationById(id).subscribe({
      next: (org) => {
        this.organization = org;
        this.newName = org.name;
        this.canManage = this.organizationService.canUpdateName(org);
        this.isLoading = false;
      },
      error: (errorMessage) => {
        this.error = errorMessage;
        this.isLoading = false;
      }
    });
  }

  private loadMyOrganization(): void {
    this.organizationService.getMyOrganization().subscribe({
      next: (org) => {
        this.organization = org;
        this.newName = org.name;
        this.canManage = this.organizationService.canUpdateName(org);
        this.isLoading = false;
      },
      error: (errorMessage) => {
        this.error = errorMessage;
        this.isLoading = false;
      }
    });
  }

  inviteMember(): void {
    if (!this.organization || !this.inviteEmail.trim()) return;

    this.organizationService.inviteToOrganization(this.organization._id!, this.inviteEmail).subscribe({
      next: (response) => {
        alert(response.message);
        this.inviteEmail = '';

        this.loadOrganization(this.organization!._id!);
      },
      error: (errorMessage) => {
        alert('Erreur : ' + errorMessage);
      }
    });
  }

  updateName(): void {
    if (!this.organization || !this.newName.trim()) return;

    this.organizationService.updateOrganizationName(this.organization._id!, this.newName).subscribe({
      next: (response) => {
        alert(response.message);
        this.organization!.name = response.organization.name;
      },
      error: (errorMessage) => {
        alert('Erreur : ' + errorMessage);
      }
    });
  }

  removeMember(memberId: string): void {
    if (!this.organization || !confirm('Retirer ce membre ?')) return;

    this.organizationService.removeMember(this.organization._id!, memberId).subscribe({
      next: (response) => {
        alert(response.message);
        this.loadOrganization(this.organization!._id!);
      },
      error: (errorMessage) => {
        alert('Erreur : ' + errorMessage);
      }
    });
  }

  deleteOrg(): void {
    if (!this.organization || !confirm('Supprimer définitivement votre organisation ?')) return;

    this.organizationService.deleteOrganization(this.organization._id!).subscribe({
      next: (response) => {
        alert(response.message);
        this.router.navigate(['/accueil']);
      },
      error: (errorMessage) => {
        alert('Erreur : ' + errorMessage);
      }
    });
  }

  leaveOrganization(): void {
    if (!confirm('Quitter cette organisation ?')) return;

    this.organizationService.leaveOrganization().subscribe({
      next: (response) => {
        alert(response.message);
        this.router.navigate(['/accueil']);
      },
      error: (errorMessage) => {
        alert('Erreur : ' + errorMessage);
      }
    });
  }


  canRemoveMember(memberId: string): boolean {
    if (!this.organization) return false;
    return this.organizationService.canRemoveMember(this.organization, memberId);
  }

  isCurrentUserChef(): boolean {
    if (!this.organization) return false;
    return this.organizationService.isChef(this.organization, this.currentUserId);
  }

  canInviteMembers(): boolean {
    if (!this.organization) return false;
    return this.organizationService.canInvite(this.organization);
  }
}