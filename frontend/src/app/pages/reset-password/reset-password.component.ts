import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-reset-password',
  imports: [SharedModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  token = '';
  valid = false;
  hidePassword = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\|;'/`~]).+$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.notification.showError('Token manquant');
      this.router.navigate(['/login']);
      return;
    }
    this.auth.validateResetToken(this.token).subscribe({
      next: () => { this.valid = true; },
      error: () => { this.notification.showError('Lien invalide ou expiré'); this.router.navigate(['/login']); }
    });
  }

  passwordsMatch(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p === c ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.form.invalid || !this.valid) return;
    this.isLoading = true;
    this.auth.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.showSuccess('Mot de passe réinitialisé');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        const validationErrors = err.error?.errors;
        if (validationErrors?.length) {
          const msg = validationErrors.map((e: any) => e.message).join(' | ');
          this.notification.showError(msg);
        } else {
          this.notification.showError(err.error?.message || 'Erreur de réinitialisation');
        }
      }
    });
  }

  toggle(field: 'password' | 'confirm') {
    if (field === 'password') this.hidePassword = !this.hidePassword;
    else this.hideConfirm = !this.hideConfirm;
  }

  getPasswordStrengthClass(): string {
    const password = this.form.get('password')?.value || '';
    const strength = this.calculatePasswordStrength(password);
    return `strength-${strength}`;
  }

  getPasswordStrengthText(): string {
    const password = this.form.get('password')?.value || '';
    const strength = this.calculatePasswordStrength(password);
    switch (strength) {
      case 'weak': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'strong': return 'Forte';
      default: return '';
    }
  }

  private calculatePasswordStrength(password: string): string {
    if (password.length < 6) return 'weak';
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\|;'/`~]/.test(password);
    const hasMinLength = password.length >= 8;
    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars, hasMinLength].filter(Boolean).length;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }
}
