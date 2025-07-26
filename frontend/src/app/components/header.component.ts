import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-header',
  imports: [SharedModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  get organizationId(): string | null {
    return this.auth.getOrganizationId();
  }

  get organizationName(): string | null {
    return this.auth.getOrganizationName();
  }

  get hasOrganization(): boolean {
    return this.auth.hasOrganization();
  }

  goHome() {
    this.router.navigate([this.auth.isLoggedIn() ? '/accueil' : '/login']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
