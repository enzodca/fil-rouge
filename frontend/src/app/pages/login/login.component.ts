import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
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
      next: () => {
        alert('Connexion réussie !');
        this.router.navigate(['/']); // redirige vers la home ou une page profil
      },
      error: err => alert('Erreur : ' + err.error.message)
    });
  }
}

