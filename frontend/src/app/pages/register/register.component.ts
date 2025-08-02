import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-register',
  imports: [SharedModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form: FormGroup;
  passwordVisible = false;
  confirmPasswordVisible = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validator: this.matchPasswords });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    const { confirmPassword, terms, ...registerData } = this.form.value;
    
    this.auth.register(registerData).subscribe({
      next: (response: any) => {
        this.notification.showSuccess('Inscription réussie ! Vérifiez votre e-mail pour activer votre compte.');
        this.router.navigate(['/login'], { 
          queryParams: { 
            message: 'Vérifiez votre e-mail pour activer votre compte',
            email: registerData.email 
          } 
        });
      },
      error: (err: any) => {
        let errorMessage = 'Erreur lors de l\'inscription';
        
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error?.error) {
          errorMessage = err.error.error;
        }
        
        this.notification.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
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
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars, hasMinLength].filter(Boolean).length;
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  private passwordStrengthValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
    
    return isValid ? null : { 'passwordStrength': true };
  }

  private matchPasswords(form: AbstractControl): {[key: string]: any} | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value ? null : { 'passwordMismatch': true };
  }
}