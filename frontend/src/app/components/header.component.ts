import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  constructor(public auth: AuthService, private router: Router) {}

  goHome() {
    this.router.navigate(['/accueil']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
