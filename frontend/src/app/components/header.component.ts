import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  constructor(public auth: AuthService, private router: Router) {}

goHome() {
  if (this.auth.isLoggedIn()) {
    this.router.navigate(['/accueil']);
  } else {
    this.router.navigate(['/']);
  }
}

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
