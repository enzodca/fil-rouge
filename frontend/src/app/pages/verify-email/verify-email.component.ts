import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-verify-email',
  imports: [SharedModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  isError = false;
  message = '';
  email = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    
    if (token) {
      this.verifyEmail(token);
    } else {
      this.isLoading = false;
      this.isError = true;
      this.message = 'Token de vérification manquant';
    }
  }

  verifyEmail(token: string) {
    this.auth.verifyEmail(token).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.message = response.message;
        this.notification.showSuccess('E-mail vérifié avec succès !');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || 'Erreur lors de la vérification';
        this.notification.showError(this.message);
      }
    });
  }

  resendVerificationEmail() {
    if (!this.email) {
      this.notification.showError('Veuillez entrer votre adresse e-mail');
      return;
    }

    this.auth.resendVerificationEmail(this.email).subscribe({
      next: (response: any) => {
        this.notification.showSuccess(response.message);
      },
      error: (err: any) => {
        this.notification.showError(err.error?.message || 'Erreur lors du renvoi');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
