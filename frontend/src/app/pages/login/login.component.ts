import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';;
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-login',
  imports: [SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: '',
      password: ''
    });
  }

  onSubmit() {
    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/accueil']),
      error: err => alert('Erreur : ' + err.error.message)
    });
  }
}
