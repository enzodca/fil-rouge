import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router } from '@angular/router';


@Component({
  selector: 'app-donation-cancel',
  imports: [SharedModule],
  templateUrl: './donation-cancel.component.html',
  styleUrls: ['./donation-cancel.component.scss']
})
export class DonationCancelComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }

  tryAgain(): void {
    this.router.navigate(['/donation']);
  }
}
