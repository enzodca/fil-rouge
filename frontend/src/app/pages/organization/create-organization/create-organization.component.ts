import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { OrganizationService } from '../../../services/organization/organization.service';

@Component({
  selector: 'app-create-organization',
  imports: [SharedModule],
  templateUrl: './create-organization.component.html'
})
export class CreateOrganizationComponent {
  form: FormGroup;
  error = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private organizationService: OrganizationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    
    this.isLoading = true;
    this.error = '';
    
    this.organizationService.createOrganization(this.form.value.name).subscribe({
      next: (response) => {
        alert('Organisation créée avec succès !');
        
        this.router.navigate(['/organization', response.organization._id]);
      },
      error: (errorMessage) => {
        this.error = errorMessage || 'Erreur lors de la création';
        this.isLoading = false;
      }
    });
  }
}