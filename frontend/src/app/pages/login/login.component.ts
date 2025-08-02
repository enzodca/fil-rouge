import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';;
import { NotificationService } from '../../services/notification/notification.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-login',
  imports: [SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  showResendEmail = false;
  isLoading = false;
  verificationMessage = '';
  emailToVerify = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {
    this.form = this.fb.group({
      email: '',
      password: ''
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.verificationMessage = params['message'];
        this.notification.showInfo(this.verificationMessage);
      }
      if (params['email']) {
        this.emailToVerify = params['email'];
        this.form.patchValue({ email: params['email'] });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.showResendEmail = false;

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/accueil']);
      },
      error: err => {
        this.isLoading = false;
        
        if (err.error?.needsEmailVerification) {
          this.showResendEmail = true;
          this.notification.showError('Veuillez vérifier votre e-mail avant de vous connecter');
        } else {
          this.notification.showError('Erreur : ' + (err.error?.message || 'Erreur inconnue'));
        }
      }
    });
  }

  resendVerificationEmail() {
    const email = this.form.get('email')?.value;
    if (!email) {
      this.notification.showError('Veuillez entrer votre adresse e-mail');
      return;
    }

    this.auth.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.notification.showSuccess('E-mail de vérification renvoyé avec succès');
        this.showResendEmail = false;
      },
      error: (err) => {
        this.notification.showError(err.error?.message || 'Erreur lors du renvoi');
      }
    });
  }
}
