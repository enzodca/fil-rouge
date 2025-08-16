import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-forgot-password',
  imports: [SharedModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  isLoading = false;
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;
    this.auth.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailSent = true;
        this.notification.showSuccess('Si un compte existe, un e-mail a été envoyé.');
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.showError(err.error?.message || "Erreur lors de l'envoi");
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
